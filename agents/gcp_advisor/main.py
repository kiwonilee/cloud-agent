import asyncio
import csv
import json
import logging
import random
import os
import sys
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure local imports work regardless of how it's executed
_current_dir = os.path.dirname(os.path.abspath(__file__))
if _current_dir not in sys.path:
    sys.path.append(_current_dir)

try:
    from gcp_analyzer.agent import root_agent as analyzer_agent
    from gcp_evaluator.agent import root_agent as evaluator_agent
    from gcp_remediator.agent import root_agent as remediator_agent
except ImportError as e:
    logger.error(f"Failed to import agents: {e}", exc_info=True)
    analyzer_agent = evaluator_agent = remediator_agent = None

from fastapi.middleware.cors import CORSMiddleware
from google.adk.runners import Runner, InMemorySessionService
from google.genai.types import Content, Part

# Global session service to reuse across requests
global_session_service = InMemorySessionService()

async def run_agent_stateless(agent, prompt: str, session_id: str) -> str:
    # Use the global session service instead of creating a new one every time
    runner = Runner(
        app_name="gcp_advisor", 
        agent=agent, 
        session_service=global_session_service, 
        auto_create_session=True
    )
    
    # Adding a simple retry logic for 429 Resource Exhausted
    max_retries = 5
    for attempt in range(max_retries):
        try:
            events = runner.run_async(
                user_id="default_user",
                session_id=session_id,
                new_message=Content(role="user", parts=[Part.from_text(text=prompt)])
            )
            res = ""
            async for event in events:
                # 1. 표준 ADK Agent 응답 파트 파싱 (Part.text)
                if getattr(event, "content", None) and getattr(event.content, "parts", None):
                    for part in event.content.parts:
                        if getattr(part, "text", None):
                            res += part.text
                # 2. 디펜시브: event 객체 자체가 문자열이거나 .text, .result 속성을 가지고 있는 경우
                elif isinstance(event, str):
                    res += event
                elif hasattr(event, "text") and isinstance(event.text, str):
                    res += event.text
                elif hasattr(event, "result") and event.result:
                    res += str(event.result)
                # 3. 디펜시브: 이벤트 문자열화 (백업)
                else:
                    # 필요 시 로그나 다른 속성 추출
                    pass
            return res
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2 + random.uniform(0.5, 2.0)
                logger.warning(f"429 detected, retrying in {wait_time:.2f}s... (Attempt {attempt + 1}/{max_retries})")
                await asyncio.sleep(wait_time)
                continue
            raise e
    return ""
router = APIRouter()

import tempfile

# Request schemas
class AnalyzeRequest(BaseModel):
    project_id: str
    sa_key: str = ""
    session_id: str
    self_check_data: Dict[str, Any] = {}

class EvaluateRequest(BaseModel):
    project_id: str
    sa_key: str = ""
    session_id: str
    infrastructure_report: str
    checklist_items: List[Dict[str, str]]

async def stream_analyze(req: AnalyzeRequest):
    temp_key_path = None
    original_creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    try:
        if req.sa_key and req.sa_key.strip():
            fd, temp_key_path = tempfile.mkstemp(suffix=".json")
            with os.fdopen(fd, 'w') as f:
                f.write(req.sa_key)
            os.environ["TARGET_SA_CREDENTIALS_PATH"] = temp_key_path

        yield f"data: {json.dumps({'type': 'status', 'agent': 'analyzer', 'message': 'Booting Agent 1: Scanning GCP CAI...'})}\n\n"
        
        analyzer_prompt = (
            f"Project ID: {req.project_id}\n"
            f"User Self-Check Data: {json.dumps(req.self_check_data)}\n"
        )
        
        report = await run_agent_stateless(analyzer_agent, analyzer_prompt, req.session_id)
        
        yield f"data: {json.dumps({'type': 'status', 'agent': 'analyzer', 'message': 'CAI Scan Complete. Returning Infrastructure Report.'})}\n\n"
        yield f"data: {json.dumps({'type': 'analyzer_done', 'agent': 'analyzer', 'report': report})}\n\n"
        yield f"data: {json.dumps({'type': 'complete', 'agent': 'system'})}\n\n"

    except Exception as e:
        logger.error(f"Analyzer critical error: {e}", exc_info=True)
        yield f"data: {json.dumps({'type': 'error', 'agent': 'analyzer', 'message': f'Critical Error: {str(e)}'})}\n\n"
    finally:
        if temp_key_path and os.path.exists(temp_key_path):
            os.remove(temp_key_path)
            if original_creds is not None:
                pass  # We did not override original_creds
            if "TARGET_SA_CREDENTIALS_PATH" in os.environ:
                del os.environ["TARGET_SA_CREDENTIALS_PATH"]

async def stream_evaluate(req: EvaluateRequest):
    temp_key_path = None
    original_creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    try:
        if req.sa_key and req.sa_key.strip():
            fd, temp_key_path = tempfile.mkstemp(suffix=".json")
            with os.fdopen(fd, 'w') as f:
                f.write(req.sa_key)
            os.environ["TARGET_SA_CREDENTIALS_PATH"] = temp_key_path

        yield f"data: {json.dumps({'type': 'status', 'agent': 'evaluator', 'message': f'Starting Agent 2 parallel loop for {len(req.checklist_items)} items.'})}\n\n"
        
        semaphore = asyncio.Semaphore(5)
        queue = asyncio.Queue()
        
        async def evaluate_item(item: Dict[str, str]):
            async with semaphore:
                item_id = item.get("id", "unknown")
                rule_text = json.dumps(item, ensure_ascii=False)
                user_status = item.get('user_status', 'Yes')
                
                # Fast-fail short-circuit for 'N' or 'Out of Scope' to skip evaluator agent
                if user_status in ['N', 'No', 'Out of Scope', 'OUT OF SCOPE']:
                    try:
                        eval_text = "사용자가 의도적으로 '미적용(N)' 또는 '예외(Out of Scope)'로 설정한 항목이므로 인프라 스캔 및 판단을 생략합니다."
                        status = "N/A"
                        
                        await queue.put(f"data: {json.dumps({'type': 'status', 'agent': 'remediator', 'rule_id': item_id, 'message': f'Invoking Agent 3 for Best Practices on {item_id}...'})}\n\n")
                        
                        rem_prompt = (
                            f"Skipped Item: {rule_text}\n"
                            f"The user has marked this item as {user_status}. Therefore, we skipped the evaluation step. Please provide ONLY the relevant Google Cloud Best Practices for this topic in Korean."
                        )
                        rem_text = await run_agent_stateless(remediator_agent, rem_prompt, f"{req.session_id}_{item_id}_rem")
                        
                        await queue.put(f"data: {json.dumps({'type': 'result', 'agent': 'evaluator', 'rule_id': item_id, 'status': status, 'reason': eval_text, 'resource': 'Target Project'})}\n\n")
                        await queue.put(f"data: {json.dumps({'type': 'remediation_plan', 'agent': 'remediator', 'rule_id': item_id, 'data': rem_text})}\n\n")
                        return
                    except Exception as e:
                        logger.error(f"Error resolving skipped item {item_id}: {e}")
                        await queue.put(f"data: {json.dumps({'type': 'error', 'agent': 'evaluator', 'rule_id': item_id, 'message': str(e)})}\n\n")
                        return

                # Normal Evaluator Path
                eval_prompt = (
                    f"You are a Cloud Infrastructure Evaluator Agent.\n"
                    f"Evaluation Target Project: {req.project_id}\n"
                    f"Checklist Item Rule (JSON):\n{rule_text}\n"
                    f"\n[⚠️ IMPORTANT INSTRUCTION]\n"
                    f"The user has specified their status/requirement as: '{user_status}'.\n"
                    f"Write your reasoning in Korean.\n\n"
                    f"---\n"
                    f"Infrastructure Report:\n{req.infrastructure_report}\n"
                    f"(IMPORTANT: Your output Reasoning MUST be written in Korean! 모든 답변은 반드시 한국어로 상세히 작성하세요.)\n"
                )
                
                try:
                    eval_text = await run_agent_stateless(evaluator_agent, eval_prompt, f"{req.session_id}_{item_id}_eval")
                    
                    status = "Match"  # Default
                    upper_text = eval_text.upper()
                    if "MISMATCH" in upper_text or "FAIL" in upper_text:
                        status = "Mismatch"
                    elif "SKIPPED" in upper_text or "?" in upper_text:
                        status = "Skipped"
                    elif "MATCH" in upper_text or "PASS" in upper_text:
                        status = "Match"
                    
                    if status in ["Mismatch", "WARNING", "Under Review"]:
                        await queue.put(f"data: {json.dumps({'type': 'status', 'agent': 'remediator', 'rule_id': item_id, 'message': f'Invoking Agent 3 for Remediation on {item_id}...'})}\n\n")
                        
                        rem_prompt = (
                            f"Failed Item: {rule_text}\n"
                            f"Evaluator Reasoning: {eval_text}\n"
                        )
                        rem_text = await run_agent_stateless(remediator_agent, rem_prompt, f"{req.session_id}_{item_id}_rem")
                        
                        # Send both Evaluator Result and Remediation Plan simultaneously
                        await queue.put(f"data: {json.dumps({'type': 'result', 'agent': 'evaluator', 'rule_id': item_id, 'status': status, 'reason': eval_text, 'resource': 'Target Project'})}\n\n")
                        await queue.put(f"data: {json.dumps({'type': 'remediation_plan', 'agent': 'remediator', 'rule_id': item_id, 'data': rem_text})}\n\n")
                    else:
                        # If passed, just send the Evaluator Result
                        await queue.put(f"data: {json.dumps({'type': 'result', 'agent': 'evaluator', 'rule_id': item_id, 'status': status, 'reason': eval_text, 'resource': 'Target Project'})}\n\n")
                        
                except Exception as e:
                    logger.error(f"Error evaluating item {item_id}: {e}")
                    await queue.put(f"data: {json.dumps({'type': 'error', 'agent': 'evaluator', 'rule_id': item_id, 'message': str(e)})}\n\n")
        
        async def run_workers():
            tasks = [asyncio.create_task(evaluate_item(item)) for item in req.checklist_items]
            await asyncio.gather(*tasks)
            await queue.put(None) 
            
        asyncio.create_task(run_workers())
        
        while True:
            msg = await queue.get()
            if msg is None:
                break
            yield msg
            
        yield f"data: {json.dumps({'type': 'complete', 'agent': 'system', 'message': 'All tasks completed successfully!'})}\n\n"
        
    except Exception as e:
        logger.error(f"Evaluation critical error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'agent': 'system', 'message': f'Critical Error: {str(e)}'})}\n\n"
    finally:
        if temp_key_path and os.path.exists(temp_key_path):
            os.remove(temp_key_path)
            if original_creds is not None:
                pass
            if "TARGET_SA_CREDENTIALS_PATH" in os.environ:
                del os.environ["TARGET_SA_CREDENTIALS_PATH"]

@router.post("/api/v1/audit/analyze")
async def audit_analyze(req: AnalyzeRequest):
    return StreamingResponse(stream_analyze(req), media_type="text/event-stream")

@router.post("/api/v1/audit/evaluate")
async def audit_evaluate(req: EvaluateRequest):
    return StreamingResponse(stream_evaluate(req), media_type="text/event-stream")


@router.get("/api/v1/config")
def get_config():
    project_id = os.environ.get("TARGET_PROJECT_ID", "")
    
    # Check for direct multi-line SA key in env var
    sa_key = os.environ.get("TARGET_SA_KEY", "")
    
    # Fallback to key.json if env var is empty
    if not sa_key:
        default_key_path = os.environ.get("DEFAULT_SA_KEY_PATH", "key.json")
        if os.path.exists(default_key_path):
            try:
                with open(default_key_path, 'r', encoding='utf-8') as f:
                    sa_key = f.read()
            except Exception as e:
                logger.error(f"Failed to read default key.json: {e}")
                
    return {
        "project_id": project_id,
        "sa_key": sa_key
    }

@router.get("/api/v1/checklist")
def get_checklist():
    csv_file_path = os.path.join(os.path.dirname(__file__), "..", "data", "checklist.csv")
    csv_file_path = os.path.normpath(csv_file_path)
    
    if not os.path.exists(csv_file_path):
        logger.error(f"CSV file not found at {csv_file_path}")
        return []
        
    checklist_data = []
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            for idx, row in enumerate(reader):
                if len(row) >= 3:
                    visible = row[3].strip() if len(row) > 3 else "Y"
                    if visible == "Y":
                        checklist_data.append({
                            "id": f"rule_{idx + 1}",
                            "type": row[0].strip(),
                            "category": row[1].strip(),
                            "details": row[2].strip(),
                            "visible": visible,
                            "default_value": row[4].strip() if len(row) > 4 else "Y"
                        })
    except Exception as e:
        logger.error(f"Failed to read CSV checklist: {e}")
        return []
    return checklist_data


@router.get("/health")
def health_check():
    return {"status": "ok", "agents_loaded": (analyzer_agent is not None)}
