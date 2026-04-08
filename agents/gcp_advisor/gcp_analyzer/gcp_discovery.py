import functools
import json
import logging
import os
from typing import Dict, Any, List

import threading
import concurrent.futures

logger = logging.getLogger(__name__)

_scan_lock = threading.Lock()
_infra_cache = {}

def synchronized(lock):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            with lock:
                return func(*args, **kwargs)
        return wrapper
    return decorator

def scan_gcp_infrastructure(project_id: str) -> str:
    """
    Scans the given Google Cloud Project using Cloud Asset Inventory and returns a 
    structured, aggregated summary of essential infrastructure resources. 
    It focuses on computing, networking, load balancers, DBs, and GKE clusters.
    
    Args:
        project_id: The ID of the GCP project to scan (e.g., 'my-company-prod-123')
        
    Returns:
        A JSON string containing the aggregated resource properties.
    """
    # ⚡ 1단계 캐시 체크: 락을 획득하기 전에 이미 캐시가 있다면 즉각 리턴하여 동시성 지체를 0초로 만듭니다.
    if project_id in _infra_cache:
        logger.info(f"🚀 [Speed Up] Cache Hit for project_id={project_id} (No Lock/No API Call)")
        return _infra_cache[project_id]

    with _scan_lock:
        # ⚡ 2단계 캐시 체크: 락을 대기하다 들어왔을 때, 앞선 녀석이 이미 캐시를 채워두었다면 즉각 리턴 (Double-Checked Locking)
        if project_id in _infra_cache:
            logger.info(f"🚀 [Speed Up] Double-Checked Cache Hit for project_id={project_id}")
            return _infra_cache[project_id]

        logger.info(f"🔍 [CAI SCAN] Starting scan for project_id: {project_id}")
        
        # Disable mTLS to work around google-auth bug in Python 3.13
        os.environ["GOOGLE_API_USE_CLIENT_CERTIFICATE"] = "false"
        
        try:
            from google.cloud import asset_v1
            from google.auth import default
        except ImportError:
            return json.dumps({"error": "Google Cloud SDKs are not installed."})

        try:
            # Use explicit SA credentials if provided by the frontend payload
            creds_path = os.environ.get("TARGET_SA_CREDENTIALS_PATH")
            if creds_path and os.path.exists(creds_path):
                from google.oauth2 import service_account
                credentials = service_account.Credentials.from_service_account_file(creds_path)
                client = asset_v1.AssetServiceClient(credentials=credentials)
            else:
                # Fallback to default ADC if no SA was uploaded
                credentials, project = default()
                client = asset_v1.AssetServiceClient(credentials=credentials)
        except Exception as e:
            logger.error(f"Failed to authenticate GCP CAI client: {e}", exc_info=True)
            return json.dumps({"error": f"Authentication failed: {e}"})

        # The scope of the search
        scope = f"projects/{project_id}"
        
        # We define the core asset types we want to gather for the Agent 1 report
        asset_types = [
            "compute.googleapis.com/Instance",
            "compute.googleapis.com/Network",
            "compute.googleapis.com/Subnetwork",
            "compute.googleapis.com/Firewall",
            "compute.googleapis.com/Router",
            "compute.googleapis.com/ForwardingRule",
            "compute.googleapis.com/InstanceGroupManager",
            "container.googleapis.com/Cluster",
            "run.googleapis.com/Service",
            "cloudfunctions.googleapis.com/CloudFunction",
            "sqladmin.googleapis.com/Instance",
            "storage.googleapis.com/Bucket",
            "iam.googleapis.com/ServiceAccount",
            "iam.googleapis.com/Role"
        ]
        
        aggregated_report = {
            "project_id": project_id,
            "resources": {}
        }

        try:
            request = asset_v1.SearchAllResourcesRequest(
                scope=scope,
                asset_types=asset_types,
                # Read all fields to get details
                read_mask="*"
            )
            
            # We limit the number of resources returned in case of massive projects
            # to prevent LLM context overflow. In production, we'd paginate and summarize further.
            response = client.search_all_resources(request=request)
            
            # ⚡ [Speed Up] Collect resources to process first
            resources_list = []
            for resource in response:
                resources_list.append(resource)

            def fetch_single_resource_details(resource):
                asset_type = resource.asset_type.split('/')[-1]
                resource_info = {
                    "name": resource.display_name or resource.name.split('/')[-1],
                    "location": resource.location,
                    "asset_type_raw": resource.asset_type
                }
                
                if resource.additional_attributes:
                    for k, v in resource.additional_attributes.items():
                        try:
                            resource_info[k] = v.get("value", None)
                        except AttributeError:
                            resource_info[k] = str(v)

                GCLOUD_DESCRIBE_MAP = {
                    "Instance": "gcloud compute instances describe {name} --project={project} --zone={location} --format=json",
                    "Network": "gcloud compute networks describe {name} --project={project} --format=json",
                    "Subnetwork": "gcloud compute networks subnets describe {name} --project={project} --region={location} --format=json",
                    "Bucket": "gcloud storage buckets describe gs://{name} --format=json",
                    "Cluster": "gcloud container clusters describe {name} --project={project} --zone={location} --format=json",
                    "SQLInstance": "gcloud sql instances describe {name} --project={project} --format=json",
                    "Service": "gcloud run services describe {name} --project={project} --region={location} --format=json"
                }

                if asset_type in GCLOUD_DESCRIBE_MAP:
                    try:
                        import subprocess
                        cmd_template = GCLOUD_DESCRIBE_MAP[asset_type]
                        cmd = cmd_template.format(name=resource_info['name'], project=project_id, location=resource.location)
                        res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
                        
                        if res.returncode == 0:
                            detailed_json = json.loads(res.stdout)
                            resource_info["raw_detailed_config"] = detailed_json
                            
                            if asset_type == "Instance":
                                resource_info["machineType"] = detailed_json.get("machineType", "").split('/')[-1]
                                resource_info["disks"] = [
                                    {
                                        "deviceName": d.get("deviceName"),
                                        "diskType": d.get("type", "").split('/')[-1] if d.get("type") else "Unknown",
                                        "diskSizeGb": d.get("diskSizeGb"),
                                        "boot": d.get("boot", False)
                                    } for d in detailed_json.get("disks", [])
                                ]
                    except Exception as ex:
                        logger.warning(f"Failed to fetch deeper details for {asset_type} {resource_info['name']}: {ex}")
                
                return asset_type, resource_info

            # ⚡ [Speed Up] 4인의 봇이 대기 타는 것을 막기 위해 10개의 스레드풀로 병렬 요약 수집!
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                # Limit to first 200 elements if massive project, otherwise process all
                subset_resources = resources_list[:200]
                futures = [executor.submit(fetch_single_resource_details, r) for r in subset_resources]
                
                for future in concurrent.futures.as_completed(futures):
                    try:
                        asset_type, resource_info = future.result()
                        if asset_type not in aggregated_report["resources"]:
                            aggregated_report["resources"][asset_type] = []
                        
                        aggregated_report["resources"][asset_type].append(resource_info)
                        
                        # Limit Roughly
                        if len(aggregated_report["resources"][asset_type]) > 50:
                            aggregated_report["resources"][asset_type] = aggregated_report["resources"][asset_type][:50]
                    except Exception as e:
                        logger.error(f"Failed to process a resource in parallel thread: {e}", exc_info=True)
                    
            try:
                iam_request = asset_v1.SearchAllIamPoliciesRequest(scope=scope)
                iam_response = client.search_all_iam_policies(request=iam_request)
                iam_policies = []
                for policy in iam_response:
                    policy_dict = {"resource": policy.resource, "project": policy.project}
                    if getattr(policy, "policy", None) and getattr(policy.policy, "bindings", None):
                        bindings_list = []
                        for binding in policy.policy.bindings:
                            bindings_list.append({"role": binding.role, "members": list(binding.members)})
                        policy_dict["bindings"] = bindings_list
                    iam_policies.append(policy_dict)
                    if len(iam_policies) >= 30:
                        break
                if iam_policies:
                    aggregated_report["iam_policies"] = iam_policies
            except Exception as e:
                logger.warning(f"Failed to retrieve IAM policies: {e}")
                
            _infra_cache[project_id] = json.dumps(aggregated_report, indent=2)
            return _infra_cache[project_id]

        except Exception as e:
            logger.error(f"Failed to search resources in CAI: {e}", exc_info=True)
            return json.dumps({"error": f"Failed to search CAI: {e}"})


def get_specific_gcp_resource(project_id: str, resource_type: str, resource_name: str) -> str:
    """
    Specifically queries GCP for deeper settings of a single resource if the initial report lacks details.
    This acts as the 'Active Discovery' tool for the Evaluator Agent.
    
    Args:
        project_id: The ID of the GCP project (e.g., 'my-company-prod-123')
        resource_type: The generic type, e.g., 'compute.googleapis.com/Instance', 'sqladmin.googleapis.com/Instance'
        resource_name: The exact name or partial name of the resource to find.
        
    Returns:
        A detailed JSON representation of the matched resource's latest state.
    """
    try:
        from google.cloud import asset_v1
    except ImportError:
        return json.dumps({"error": "Google Cloud SDKs are not installed."})

    try:
        creds_path = os.environ.get("TARGET_SA_CREDENTIALS_PATH")
        if creds_path and os.path.exists(creds_path):
            from google.oauth2 import service_account
            credentials = service_account.Credentials.from_service_account_file(creds_path)
            client = asset_v1.AssetServiceClient(credentials=credentials)
        else:
            client = asset_v1.AssetServiceClient()
        scope = f"projects/{project_id}"
        
        # Formulate a search query using the provided resource name
        query = f"name:*{resource_name}*"
        
        request = asset_v1.SearchAllResourcesRequest(
            scope=scope,
            query=query,
            asset_types=[resource_type] if resource_type else [],
            read_mask="*" # Get all metadata
        )
        
        response = client.search_all_resources(request=request)
        
        results = []
        for resource in response:
            results.append({
                "name": resource.name,
                "asset_type": resource.asset_type,
                "location": resource.location,
                "project": resource.project,
                "additional_attributes": {k: str(v) for k, v in resource.additional_attributes.items()} if resource.additional_attributes else {}
            })
            
            # Try to return only the first highly confident match to save tokens
            if len(results) >= 3:
                break
                
        if not results:
            return json.dumps({"error": "Resource not found or inaccessible."})
            
        return json.dumps(results, indent=2)
        
    except Exception as e:
        logger.error(f"Active discovery failed: {e}")
        return json.dumps({"error": f"API call failed: {e}"})

def execute_gcloud_command(project_id: str, command: str) -> str:
    """
    Executes a read-only gcloud command to fetch live metadata from the GCP environment.
    Use this when you need detailed granular settings (like DB flags, regional HA settings) not provided in the basic report.
    
    Args:
        project_id: The GCP project ID.
        command: The full gcloud command to run (e.g. "gcloud sql instances describe inst-1 --format=json")
                 Do NOT include the --project flag, it will be added automatically.
        
    Returns:
        The standard output of the command or the error string.
    """
    import subprocess
    import os
    
    if not command.strip().startswith("gcloud"):
        return json.dumps({"error": "Only 'gcloud' commands are allowed."})
    
    # Security: block mutating commands
    forbidden = ["delete", "create", "update", "patch", "set", "remove"]
    for f in forbidden:
        if f in command:
            return json.dumps({"error": f"Mutating commands are forbidden. Found '{f}'."})
            
    # Inject auth via GOOGLE_APPLICATION_CREDENTIALS for ADC compatibility
    creds_path = os.environ.get("TARGET_SA_CREDENTIALS_PATH")
    env = os.environ.copy()
    if creds_path and os.path.exists(creds_path):
        env["GOOGLE_APPLICATION_CREDENTIALS"] = creds_path
        # gcloud CLI does NOT natively respect GOOGLE_APPLICATION_CREDENTIALS by default.
        # It requires this specific override variable to use the Service Account JSON on the fly.
        env["CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE"] = creds_path

        
    if "--project" not in command:
        command += f" --project={project_id}"
        
    if "--format" not in command:
        command += " --format=json"
        
    try:
        res = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=15, env=env)
        if res.returncode == 0:
            return res.stdout
        else:
            return json.dumps({"error": f"gcloud execution failed: {res.stderr}"})
    except Exception as e:
        logger.error(f"Failed to run gcloud command {command}: {e}", exc_info=True)
        return json.dumps({"error": f"Execution exception: {e}"})

