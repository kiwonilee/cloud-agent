/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, Fragment } from 'react';
import JSZip from 'jszip';
import {
  CloudUpload,
  Map as MapIcon,
  ClipboardCheck,
  Code,
  BookOpen,
  HelpCircle,
  Bell,
  Settings,
  Rocket,
  FileDown,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Info,
  ShieldCheck,
  Zap,
  Copy,
  Download,
  FileText,
  Sliders,
  Share,
  Cpu,
  Bot,
  Database,
  Globe,
  Layout,
  MessageSquare,
  X,
  Send,
  Loader2,
  Server,
  Activity,
  Compass,
  Navigation,
  Terminal as TerminalIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Page, NavItem, VerificationItem, MappingItem, ChatMessage, AppMode } from './types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Common Markdown Styles ---
const SharedMarkdownComponents = {
  h1: ({ node, ...props }: any) => <h1 className="text-2xl font-headline font-bold text-primary mt-8 mb-4" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-xl font-headline font-bold text-on-surface mt-8 mb-3 pb-2 border-b border-outline-variant/30" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-lg font-headline font-semibold text-on-surface mt-6 mb-2" {...props} />,
  h4: ({ node, ...props }: any) => <h4 className="text-base font-headline font-medium text-on-surface mt-4 mb-2" {...props} />,
  p: ({ node, ...props }: any) => <p className="text-on-surface-variant leading-relaxed mb-4 text-base" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 mb-4 space-y-2 text-base text-on-surface-variant" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-base text-on-surface-variant" {...props} />,
  li: ({ node, ...props }: any) => <li className="pl-1 leading-relaxed" {...props} />,
  strong: ({ node, ...props }: any) => <strong className="font-bold text-primary/90" {...props} />,
  table: ({ node, ...props }: any) => <div className="overflow-x-auto my-6"><table className="w-full border-collapse border border-outline-variant/20 rounded-lg text-sm" {...props} /></div>,
  thead: ({ node, ...props }: any) => <thead className="bg-surface-container-high text-on-surface font-bold text-left" {...props} />,
  tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-outline-variant/10 text-on-surface" {...props} />,
  tr: ({ node, ...props }: any) => <tr className="hover:bg-surface-container-low/30 transition-colors" {...props} />,
  th: ({ node, ...props }: any) => <th className="p-3 border-b border-outline-variant/20 font-bold text-on-surface text-xs uppercase tracking-wider bg-surface-container" {...props} />,
  td: ({ node, ...props }: any) => <td className="p-3 align-top leading-relaxed text-on-surface-variant" {...props} />,
  code: ({ node, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    return match ? (
      <div className="rounded-md overflow-hidden my-4 border border-outline-variant/20 shadow-sm">
        <div className="bg-surface-container-high px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
          <Code className="w-3 h-3" />
          {match[1]}
        </div>
        <pre className="bg-[#1e1e1e] p-4 overflow-x-auto text-[12px] max-h-[500px] overflow-y-auto custom-scrollbar">
          <code className="text-[#d4d4d4] font-mono" {...props}>{children}</code>
        </pre>
      </div>
    ) : (
      <code className="bg-surface-container-low text-primary px-1.5 py-0.5 rounded text-sm font-mono border border-primary/10" {...props}>{children}</code>
    );
  }
};

const TopBar = ({ activePage, onPageChange, appMode, onModeChange }: { activePage: Page, onPageChange: (page: Page) => void, appMode: AppMode, onModeChange: (mode: AppMode) => void }) => {
  const migrationItems: NavItem[] = [
    { id: 'upload', label: 'Design Capture', icon: 'CloudUpload' },
    { id: 'analysis', label: 'AWS Audit', icon: 'FileText' },
    { id: 'mapping', label: 'Google Cloud Mapping', icon: 'MapIcon' },
    { id: 'terraform', label: 'Terraform Output', icon: 'Code' },
  ];

  const advisorItems: NavItem[] = [
    { id: 'audit_setup', label: 'Configuration', icon: 'Settings' },
    { id: 'audit_report', label: 'Infra Report', icon: 'FileText' },
    { id: 'audit_live', label: 'Checklist', icon: 'Zap' },
  ];

  const currentItems = appMode === 'migration' ? migrationItems : advisorItems;

  return (
    <header className="h-[88px] bg-[#0b1437]/95 backdrop-blur-md border-b border-blue-900/30 flex items-center justify-between px-6 shrink-0 z-50 sticky top-0 overflow-x-auto whitespace-nowrap scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <div className="flex items-center gap-4 lg:gap-4 min-w-max">
        
        {/* LOGO */}
        <div className="flex items-center gap-3 pr-4 lg:pr-4 border-r border-blue-900/30 pointer-events-none select-none">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 shadow-[0_4px_20px_rgba(6,182,212,0.4)] text-white hover:scale-105 active:scale-95 transition-all duration-300">
            <Navigation className="w-6 h-6" />
          </div>
          <div className="flex flex-col items-start leading-tight">
            <h1 className="font-headline text-xl tracking-tight text-white flex gap-2 items-center">
              <span className="font-black">Google Cloud <span className="font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Navigator</span></span>
              <span className="font-bold text-fuchsia-100 bg-fuchsia-500/10 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border border-fuchsia-500/30 backdrop-blur-sm shadow-[0_0_10px_rgba(217,70,239,0.15)]">by Agent</span>
            </h1>
          </div>
        </div>

        {/* MAIN MENU */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { onModeChange('gcp_advisor'); onPageChange('audit_setup'); }}
            className={cn("px-4 py-2.5 rounded-md font-bold text-base transition-all duration-300 flex items-center gap-2", appMode === 'gcp_advisor' ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white")}
          >
            <ShieldCheck className="w-4 h-4" />
            Google Cloud Advisor
          </button>
          <button 
            onClick={() => { onModeChange('migration'); onPageChange('upload'); }}
            className={cn("px-4 py-2.5 rounded-md font-bold text-base transition-all duration-300 flex items-center gap-2", appMode === 'migration' ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white")}
          >
            <Rocket className="w-4 h-4" />
            AWS Migration
          </button>
        </div>

        {/* DIVIDER */}
        <div className="w-px h-6 bg-blue-900/30 hidden md:block" />

        {/* SUB MENU */}
        <nav className="flex items-center">
          {currentItems.map((item, index) => (
            <Fragment key={item.id}>
              <button
                onClick={() => onPageChange(item.id)}
                className={cn(
                  "relative h-[88px] px-3 lg:px-4 font-bold text-base transition-all duration-300 flex items-center gap-2 group shrink-0",
                  activePage === item.id 
                    ? "text-blue-400" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                {/* STEP NUMBER BADGE */}
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] border transition-all duration-300",
                  activePage === item.id 
                    ? "bg-blue-500 border-blue-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                    : "bg-transparent border-slate-600 text-slate-500 group-hover:border-slate-400 group-hover:text-slate-300"
                )}>
                  {index + 1}
                </div>
                
                <span className="relative z-10">{item.label}</span>
                
                {activePage === item.id && (
                  <motion.div 
                    layoutId="topbar-active" 
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-500 shadow-[0_-2px_8px_rgba(59,130,246,0.6)] z-20 rounded-t-full" 
                  />
                )}
                
                {/* Subtle hover background highlight for non-active items */}
                {activePage !== item.id && (
                  <div className="absolute inset-x-1 inset-y-3 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                )}
              </button>
              
              {/* CONNECTING CHEVRON (Stepper Indicator) */}
              {index < currentItems.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-700 shrink-0 mx-0.5" />
              )}
            </Fragment>
          ))}
        </nav>
      </div>

    </header>
  );
};

const PageHeader = ({ step, title, description, rightElement }: { step?: string, title: string, description: React.ReactNode, rightElement?: React.ReactNode }) => (
  <div className="mb-10 flex justify-between items-end">
    <div>
      {step && <span className="text-primary font-mono text-[10px] uppercase tracking-[0.2em] font-bold mb-2 block">{step}</span>}
      <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">{title}</h2>
      <div className="text-on-surface-variant text-base">{description}</div>
    </div>
    {rightElement && <div>{rightElement}</div>}
  </div>
);

const ApprovalPanel = ({
  title = "Analysis & Verification Complete - Awaiting Approval",
  description = "Architecture design needs approval to proceed to the next step.",
  onConfirm,
  onFeedback,
  isLoading,
  confirmText = "Approve & Proceed",
  feedbackText = "Add Feedback",
  feedbackPlaceholder = "e.g. 'Please adjust...'"
}: {
  title?: string,
  description?: string,
  onConfirm: () => void,
  onFeedback?: (text: string) => void,
  isLoading: boolean,
  confirmText?: string,
  feedbackText?: string,
  feedbackPlaceholder?: string
}) => {
  const feedbackInputRef = useRef<HTMLTextAreaElement>(null);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  return (
    <div className="space-y-4 mb-8">
      <div className="glass-panel p-6 rounded-xl border border-secondary/30 bg-secondary/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
        <div>
          <h4 className="font-headline font-bold text-lg text-secondary">{title}</h4>
          <p className="text-sm text-on-surface-variant">{description}</p>
        </div>
        <div className="flex gap-3">

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-secondary text-white px-8 py-2.5 rounded-md font-bold text-xs shadow-md hover:scale-105 transition-transform flex items-center gap-1"
          >
            {confirmText}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>


    </div>
  );
};

const UploadPage = ({ onAnalyze, isLoading }: { onAnalyze: (desc: string, metadata: any, file: { name: string, type: string, base64: string } | null) => void, isLoading: boolean }) => {
  const [desc, setDesc] = useState('');
  const [serviceCriticality, setServiceCriticality] = useState('');
  const [rto, setRto] = useState('');
  const [globalUserBase, setGlobalUserBase] = useState('');
  const [trafficScale, setTrafficScale] = useState('');
  const [trafficPattern, setTrafficPattern] = useState('');
  const [availabilityGoal, setAvailabilityGoal] = useState('');
  const [architectureStyle, setArchitectureStyle] = useState('');
  const [orchestrationTool, setOrchestrationTool] = useState('');
  const [isIaC, setIsIaC] = useState(false);
  const [isImmutable, setIsImmutable] = useState(false);
  const [isCentralizedLogging, setIsCentralizedLogging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string, type: string, base64: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result?.toString().split(',')[1];
      if (base64) setSelectedFile({ name: file.name, type: file.type, base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeClick = () => {
    if (!desc.trim() && !selectedFile) {
       alert('Please provide an Architecture Diagram or an Additional Description to start the analysis.');
       return;
    }
    const metadata = {
      serviceCriticality, rto, globalUserBase,
      trafficScale, trafficPattern, availabilityGoal,
      architectureStyle, orchestrationTool,
      isIaC, isImmutable, isCentralizedLogging
    };
    onAnalyze(desc, metadata, selectedFile);
  };

  return (
    <div className="animate-fadeIn space-y-10 pb-20">
      <PageHeader 
        step="Step 01" 
        title="Design Capture" 
        description="Provide your AWS infrastructure diagram and define your operational goals for a rigorous QA audit." 
        rightElement={(
          <button
            onClick={handleAnalyzeClick}
            disabled={isLoading}
            className={cn(
              "bg-[#2563EB] text-white px-10 py-3.5 rounded-[2rem] font-bold text-base shadow-[0_10px_40px_rgba(37,99,235,0.3)] flex items-center gap-3 transition-all hover:scale-[1.02] hover:bg-blue-700 active:scale-[0.98] border border-blue-400/20",
              isLoading && "opacity-50 cursor-not-allowed bg-slate-400 shadow-none border-none"
            )}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
            {isLoading ? "Starting..." : "Start Analysis"}
          </button>
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-8 rounded-xl border border-outline-variant/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-bold text-xl text-on-surface">Register Architecture Diagram</h3>
            </div>
            
            <div 
              className={cn("border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 relative overflow-hidden group", isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-outline-variant/50 hover:border-primary/50 hover:bg-surface-container-lowest", selectedFile ? "bg-surface-container-lowest" : "")}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
            >
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileSelect} accept="image/*" />
              
              {selectedFile ? (
                <div className="flex flex-col items-center gap-4 animate-fadeIn h-full w-full justify-center">
                  <div className="relative w-full max-w-[200px] aspect-video rounded-lg overflow-hidden border-2 border-primary/20 shadow-md group-hover:scale-[1.02] transition-transform">
                    <img 
                      src={`data:${selectedFile.type};base64,${selectedFile.base64}`} 
                      alt="Architecture Preview" 
                      className="w-full h-full object-contain bg-surface-container-lowest rounded-md"
                    />
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle2 className="w-10 h-10 text-primary drop-shadow-md" />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface truncate max-w-[250px]">{selectedFile.name}</p>
                    <p className="text-xs text-on-surface-variant mt-1">Ready for analysis</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-on-surface-variant group-hover:text-primary group-hover:bg-primary/10 transition-all duration-300">
                    <CloudUpload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface mb-1">Drag & drop your AWS diagram here</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-8 rounded-xl border border-outline-variant/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="font-headline font-bold text-xl text-on-surface mb-2">Additional Description</h3>
            <textarea
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. 'This architecture uses EKS for microservices and Aurora PostgreSQL. Route53 is used for DNS but not shown...'"
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none shadow-inner"
            />
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-lg">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant/20">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="font-headline font-bold text-lg text-on-surface">Operational Goals <span className="text-sm text-on-surface-variant font-normal">(Optional)</span></h3>
            </div>


            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Business Requirements</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">Service Criticality</label>
                    <select value={serviceCriticality} onChange={(e) => setServiceCriticality(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 text-on-surface text-xs rounded p-2 focus:border-primary outline-none">
                      <option value="">None (Not Specified)</option>
                      <option value="Tier 1 (Mission Critical)">Tier 1 (Mission Critical)</option>
                      <option value="Tier 2 (Business Critical)">Tier 2 (Business Critical)</option>
                      <option value="Tier 3 (Internal/Non-critical)">Tier 3 (Internal/Non-critical)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">Global User Base</label>
                    <select value={globalUserBase} onChange={(e) => setGlobalUserBase(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 text-on-surface text-xs rounded p-2 focus:border-primary outline-none">
                      <option value="">None (Not Specified)</option>
                      <option value="Domestic Only">Domestic Only</option>
                      <option value="Specific Regions">Specific Regions</option>
                      <option value="Global Service">Global Service</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">Target RTO</label>
                    <select value={rto} onChange={(e) => setRto(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 text-on-surface text-xs rounded p-2 focus:border-primary outline-none">
                      <option value="">None (Not Specified)</option>
                      <option value="Within 1 hour">Within 1 hour</option>
                      <option value="Within 4 hours">Within 4 hours</option>
                      <option value="Within 24 hours">Within 24 hours</option>
                      <option value="Best Effort">Best Effort</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-outline-variant/20">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Traffic & Scalability</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">Traffic Scale</label>
                    <select value={trafficScale} onChange={(e) => setTrafficScale(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 text-on-surface text-xs rounded p-2 focus:border-primary outline-none">
                      <option value="">None (Not Specified)</option>
                      <option value="Low (&lt; 1K)">Low (&lt; 1K)</option>
                      <option value="Medium (1K ~ 10K)">Medium (1K ~ 10K)</option>
                      <option value="High (10K ~ 100K)">High (10K ~ 100K)</option>
                      <option value="Massive (&gt; 100K)">Massive (&gt; 100K)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">Traffic Pattern</label>
                    <select value={trafficPattern} onChange={(e) => setTrafficPattern(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 text-on-surface text-xs rounded p-2 focus:border-primary outline-none">
                      <option value="">None (Not Specified)</option>
                      <option value="Steady (No Spikes)">Steady (No Spikes)</option>
                      <option value="Predictable Spikes">Predictable Spikes</option>
                      <option value="Unpredictable Spikes">Unpredictable Spikes</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">Availability (SLA) Goal</label>
                    <select value={availabilityGoal} onChange={(e) => setAvailabilityGoal(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 text-on-surface text-xs rounded p-2 focus:border-primary outline-none">
                      <option value="">None (Not Specified)</option>
                      <option value="99.0%">99.0%</option>
                      <option value="99.9% (Single AZ)">99.9% (Single AZ)</option>
                      <option value="99.99% (Multi-AZ)">99.99% (Multi-AZ)</option>
                      <option value="99.999% (Multi-Region)">99.999% (Multi-Region)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-outline-variant/20">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Architecture Standards</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">Architecture Style</label>
                    <select value={architectureStyle} onChange={(e) => setArchitectureStyle(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 text-on-surface text-xs rounded p-2 focus:border-primary outline-none">
                      <option value="">None (Not Specified)</option>
                      <option value="Monolithic">Monolithic</option>
                      <option value="Service Oriented (SOA)">Service Oriented (SOA)</option>
                      <option value="Microservices (MSA)">Microservices (MSA)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">Orchestration Platform</label>
                    <select value={orchestrationTool} onChange={(e) => setOrchestrationTool(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 text-on-surface text-xs rounded p-2 focus:border-primary outline-none">
                      <option value="">None (Not Specified)</option>
                      <option value="None (EC2/VM Based)">None (EC2/VM Based)</option>
                      <option value="Managed Kubernetes (EKS/GKE)">Managed Kubernetes (EKS/GKE)</option>
                      <option value="Serverless Containers (Fargate/Cloud Run)">Serverless Containers (Fargate/Cloud Run)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-outline-variant/20">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Operational Policies</h4>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                  <label className="flex items-center gap-3 text-xs font-semibold text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
                    <input type="checkbox" checked={isIaC} onChange={(e) => setIsIaC(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4 bg-surface-container-low border border-primary/20" />
                    IaC Applied
                  </label>
                  <label className="flex items-center gap-3 text-xs font-semibold text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
                    <input type="checkbox" checked={isImmutable} onChange={(e) => setIsImmutable(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4 bg-surface-container-low border border-primary/20" />
                    Immutable Infra
                  </label>
                  <label className="flex items-center gap-3 text-xs font-semibold text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
                    <input type="checkbox" checked={isCentralizedLogging} onChange={(e) => setIsCentralizedLogging(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4 bg-surface-container-low border border-primary/20" />
                    Central Logging
                  </label>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MappingPage = ({ mappings, report, onConfirm, awaitingApproval, isLoading }: { mappings: MappingItem[], report: string, onConfirm: () => void, awaitingApproval: boolean, isLoading: boolean }) => {
  return (
    <div className="animate-fadeIn space-y-10 pb-20">
      <PageHeader step="Step 03" title="Google Cloud Mapping" description="Automated translation of source infrastructure into target-native cloud services." />
      {awaitingApproval && (
        <ApprovalPanel
          title="Mapping Complete - Awaiting Approval"
          description="Infrastructure service mapping complete. Proceed to generate Terraform Output?"
          confirmText="Proceed & Generate TF"
          onConfirm={onConfirm}
          isLoading={isLoading}
        />
      )}
      <div className="grid grid-cols-12 gap-8 mb-4">
        <div className="col-span-5 text-on-surface-variant font-mono text-[10px] uppercase tracking-[0.2em]">Source Identity (AWS)</div>
        <div className="col-span-2"></div>
        <div className="col-span-5 text-on-surface-variant font-mono text-[10px] uppercase tracking-[0.2em]">Target Identity (GCP)</div>
      </div>

      <div className="space-y-6">
        {mappings.length === 0 ? (
          <p className="text-center text-on-surface-variant italic p-12 bg-surface-container-lowest rounded-md">No mappings generated yet.</p>
        ) : (
          mappings.map((item, i) => (
            <div key={i} className="grid grid-cols-12 items-center">
              <div className="col-span-5 bg-surface-container-lowest p-6 rounded-md shadow-[0_40px_40px_-5px_rgba(25,28,29,0.04)] border-l-4 border-[#ff9900]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#ff9900]/10 rounded flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5 text-[#ff9900]" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-lg">{item.source.name}</h3>
                    <p className="text-xs text-on-surface-variant font-mono truncate max-w-[200px] font-bold">{item.source.id}</p>
                  </div>
                </div>
              </div>

              <div className="col-span-2 flex flex-col items-center justify-center px-4">
                <div className={cn("text-[10px] font-mono font-bold mb-1", item.confidence >= 95 ? "text-green-600" : "text-primary")}>
                  {item.confidence}%
                </div>
                <div className="h-0.5 w-full bg-gradient-to-r from-[#ff9900] via-primary to-primary-container relative">
                  <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full ring-4 ring-surface", item.status === 'verified' ? "bg-primary" : "bg-secondary")}></div>
                </div>
              </div>

              <div className="col-span-5 bg-surface-container-lowest p-6 rounded-md shadow-[0_40px_40px_-5px_rgba(25,28,29,0.04)] border-r-4 border-primary">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center shrink-0">
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-lg">{item.target.name}</h3>
                      <p className="text-xs text-on-surface-variant font-mono truncate max-w-[200px] font-bold">{item.target.id || "N/A"}</p>
                    </div>
                  </div>
                  {item.status === 'verified' ? (
                    <CheckCircle2 className="w-5 h-5 text-primary fill-primary/10" />
                  ) : (
                    <Clock className="w-5 h-5 text-secondary" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {report && (
        <div className="mt-16 pt-10 border-t border-outline-variant/20">
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-outline-variant/10">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={SharedMarkdownComponents}>
              {report}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

const AnalysisPage = ({ report, checklistItems, awaitingApproval, onConfirm, onFeedback, isLoading, setLoadingMsg }: { report: string, checklistItems: VerificationItem[], awaitingApproval: boolean, onConfirm: () => void, onFeedback: (text: string) => void, isLoading: boolean, setLoadingMsg: (msg: string) => void }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'checklist'>('report');

  return (
    <div className="animate-fadeIn space-y-10 pb-20">
      <PageHeader step="Step 02" title="AWS Audit" description="Detailed architecture audit, breakdown, and validation checklist." />

      {awaitingApproval && (
        <ApprovalPanel
          title="Analysis & Audit Complete - Awaiting Approval"
          description="Architecture analysis and quality audit complete. Proceed to GCP Resource Mapping?"
          confirmText="Approve & Proceed"
          onConfirm={() => {
            setLoadingMsg("✅ Approval complete. Generating Terraform Codes for Google Cloud...");
            onConfirm();
          }}
          onFeedback={(text) => {
            setLoadingMsg("💡 Adjusting architecture based on feedback...");
            onFeedback(text);
          }}
          isLoading={isLoading}
        />
      )}

      {(!report && (!checklistItems || checklistItems.length === 0)) ? (
        <p className="text-center text-on-surface-variant italic p-12 bg-surface-container-lowest rounded-md">No detailed analysis report generated yet.</p>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_40px_40px_-5px_rgba(25,28,29,0.04)] border border-outline-variant/10 relative flex flex-col">
          <div className="flex border-b border-outline-variant/20 bg-surface-container-low px-6 pt-4 shrink-0">
            <button onClick={() => setActiveTab('report')} className={cn("px-6 py-3 font-bold text-sm border-b-2 transition-colors", activeTab === 'report' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface")}>
              Analysis Report
            </button>
            <button onClick={() => setActiveTab('checklist')} className={cn("px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2", activeTab === 'checklist' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface")}>
              Quality Audit Checklist
              {checklistItems && checklistItems.length > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">{checklistItems.length}</span>
              )}
            </button>
          </div>

          <div className="p-8 flex-1">
            {activeTab === 'report' && (
              <div className="text-on-surface">
                {report ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={SharedMarkdownComponents}>
                    {report}
                  </ReactMarkdown>
                ) : (
                  <p className="text-center text-on-surface-variant italic py-8">Report data is empty.</p>
                )}
              </div>
            )}

            {activeTab === 'checklist' && (
              <div className="space-y-6">
                {(!checklistItems || checklistItems.length === 0) ? (
                  <p className="text-center text-on-surface-variant italic py-8">No checklist items generated.</p>
                ) : (
                  checklistItems.map((item) => (
                    <div key={item.id} className={cn("group transition-all duration-300 p-6 flex items-start gap-6 rounded-xl relative overflow-hidden border bg-white hover:shadow-md shadow-sm", item.status === 'complete' ? "border-red-100 hover:border-red-200" : item.status === 'warning' ? "border-amber-100 hover:border-amber-200" : "border-emerald-100 hover:border-emerald-200")}>
                      <div className={cn("w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg shadow-sm mt-1", item.status === 'complete' ? "bg-red-50 text-red-600" : item.status === 'warning' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600")}>
                        {item.status === 'complete' ? <AlertTriangle className="w-6 h-6" /> : item.status === 'warning' ? <HelpCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-mono font-bold text-on-surface-variant opacity-60">ID: {item.id}</span>
                        </div>
                        <h5 className="font-headline font-bold text-on-surface text-base">{item.title}</h5>
                        <p className="text-sm text-on-surface-variant">{item.description}</p>
                        <div className="flex items-center gap-1 mt-3 text-[11px] font-bold tracking-tight">
                          {item.status === 'complete' ? (
                            <span className="text-red-600 flex items-center gap-1">❌ Not Applied — Verification passed but not yet applied to target.</span>
                          ) : item.status === 'warning' ? (
                            <span className="text-amber-600 flex items-center gap-1">⚠️ Under Review — Security or architecture concern detected. Manual review required.</span>
                          ) : (
                            <span className="text-emerald-600 flex items-center gap-1">✅ Applied — Already configured in the target environment.</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.05)]", item.status === 'complete' ? "bg-red-50 text-red-700" : item.status === 'warning' ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-600")}>
                          {item.status === 'complete' ? 'Not Applied' : item.status === 'warning' ? 'Under Review' : 'Applied'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TerraformPage = ({ files, report }: { files: { [filename: string]: string }, report?: string }) => {
  const fileNames = Object.keys(files);
  const [activeTab, setActiveTab] = useState<string>(fileNames[0] || 'main.tf');
  const code = files[activeTab] || "";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    Object.entries(files).forEach(([name, content]) => {
      zip.file(name, content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'terraform-infra.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fadeIn space-y-10 pb-20">
      <PageHeader step="Step 04" title="Terraform Output" description="Production-ready IaC (Infrastructure as Code) templates based on verified targets." rightElement={(
        <div className="flex gap-2">
          <button onClick={handleDownloadZip} className="bg-surface text-primary border border-primary/20 px-4 py-2 rounded-md font-bold text-xs hover:bg-primary/5 transition-all flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4" /> Download ZIP
          </button>
        </div>
      )} />

      {fileNames.length === 0 ? (
        <p className="text-center text-on-surface-variant italic p-12 bg-surface-container-lowest rounded-md">No Terraform code generated yet. Please complete the mapping phase.</p>
      ) : (
        <>
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_40px_40px_-5px_rgba(25,28,29,0.04)] border border-outline-variant/20 overflow-hidden flex h-auto min-h-[600px]">
            <div className="w-[240px] bg-surface-container-low border-r border-outline-variant/20 flex flex-col">
              <div className="p-4 border-b border-outline-variant/10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Project Files
                </h3>
              </div>
              <div className="flex-1 py-2">
                {fileNames.map(name => (
                  <button
                    key={name}
                    onClick={() => setActiveTab(name)}
                    className={cn("w-full text-left px-4 py-2 text-sm font-mono transition-colors border-l-2", activeTab === name ? "bg-primary/10 text-primary border-primary font-bold" : "text-on-surface-variant border-transparent hover:bg-surface-container hover:text-on-surface")}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              <div className="h-12 border-b border-outline-variant/60 bg-surface-container-low flex items-center justify-between px-4">
                <div className="flex items-center gap-2 text-sm font-mono font-bold text-on-surface">
                  <Code className="w-4 h-4 text-primary" /> {activeTab}
                </div>
                <button onClick={handleCopyCode} className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded hover:bg-white" title="Copy code">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
                <div className="flex-grow font-mono text-sm bg-white py-4 shadow-inner overflow-auto">
                {code.trim().split("\n").map((line, i) => (
                  <div key={i} className="flex hover:bg-surface-container-low px-4 leading-6 w-max min-w-full">
                    <div className="w-10 text-on-surface-variant/40 select-none text-right pr-3 font-mono border-r border-outline-variant/30 mr-4 shrink-0 sticky left-0 bg-white">
                      {(i + 1).toString().padStart(2, '0')}
                    </div>
                    <pre className="whitespace-pre text-slate-800 font-mono">{line || " "}</pre>
                  </div>
                ))}
              </div>
            </div>
          </div>

            {/* 🛡️ [Modified] Render Terraform code analysis report at the bottom */}
          {report && (
            <div className="mt-8 pt-8 border-t border-outline-variant/20">
              <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-outline-variant/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-xl text-on-surface">Architecture Analysis & Compliance</h3>
                    <p className="text-xs text-on-surface-variant">Explanation of security posture, scaling features, and code structure.</p>
                  </div>
                </div>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={SharedMarkdownComponents}>
                  {report}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Checklist data is now loaded dynamically from backend API (/api/v1/checklist)
const CHECKLIST_DATA: any[] = [];



const extractSection = (text: string, title: string): string => {
  if (!text) return "";

  // 1. JSON 포맷 파싱 시도 (LLM이 Markdown 대신 JSON 객체로 응답하는 경우 처리)
  try {
    // 마크다운 코드블럭(```json ... ```) 내부의 텍스트만 추출하거나, 전체 텍스트를 사용
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
    
    if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object') {
        const key = Object.keys(parsed).find(k => k.toLowerCase() === title.toLowerCase() || k.toLowerCase() === '상세 이유');
        if (key && parsed[key]) {
          return String(parsed[key]).trim();
        }
      }
    }
  } catch (e) {
    // JSON 형식이 아니거나 파싱 실패 시, 무시하고 아래 마크다운 파싱 로직으로 진행
  }

  // 2. 일반 마크다운 파싱 로직
  const lines = text.split('\n');
  let inSection = false;
  let result: string[] = [];
  
  // 대소문자 무시 및 마크다운 볼드(**), 하이픈(-), 우물정(###) 기호가 동반되더라도 유연하게 매칭
  const titleRegex = new RegExp(`^(?:\\s*[-*#]+)?\\s*(?:\\*\\*)?\\s*${title}\\s*(?:\\*\\*)?\\s*:`, 'i');
  
  // 다음 섹션의 시작을 감지하는 정규식 (예: "- **Reasoning**:", "### Status:")
  const sectionBreakRegex = /^(?:\s*[-*#]+)?\s*(?:\*\*)?[a-zA-Z0-9\s]+(?:\*\*)?\s*:/;

  for (const line of lines) {
    if (titleRegex.test(line)) {
      inSection = true;
      const contentAfterTitle = line.split(':').slice(1).join(':').trim();
      const cleanContent = contentAfterTitle.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
      if (cleanContent) result.push(cleanContent);
      continue;
    }
    
    // 만약 다른 지정된 마크다운 섹션 필드명 패턴이 등장하면 추출 종료
    if (inSection && sectionBreakRegex.test(line.trim())) {
      break;
    }
    
    // 특정 섹션 추출 시 예외 간섭 방어
    if (inSection && title === 'Reasoning' && line.includes('Google Cloud Best Practices')) {
      break;
    }

    if (inSection) {
      result.push(line);
    }
  }
  return result.join('\n').trim();
};

const CommandBlock = ({ command }: { command: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded bg-[#1e2124] border border-outline-variant/10 overflow-hidden mb-3 font-mono text-[11px]">
      <div className="p-3 pr-12 overflow-x-auto overflow-y-auto max-h-[350px] whitespace-pre text-[#A9B1D6]">
        {command}
      </div>
      <div className="absolute top-0 right-0 h-full flex items-center pr-2">
         <button onClick={handleCopy} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Copy">
           {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
         </button>
      </div>
    </div>
  );
};

const TerraformCodeBlock = ({ className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');

  const handleCopy = () => {
    const textToCopy = String(children).replace(/\n$/, '');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return match ? (
    <div className="rounded-md overflow-hidden my-4 border border-outline-variant/20 shadow-sm relative group">
      <div className="bg-surface-container-high px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Code className="w-3 h-3" />
          {match[1]}
        </div>
        <button onClick={handleCopy} className="p-1 px-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center gap-1 text-[10px]" title="Copy">
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-[#1e1e1e] p-4 overflow-x-auto text-[12px] max-h-[800px] overflow-y-auto custom-scrollbar">
        <code className="text-[#d4d4d4] font-mono" {...props}>{children}</code>
      </pre>
    </div>
  ) : (
    <code className="bg-surface-container-low text-primary px-1.5 py-0.5 rounded text-sm font-mono border border-primary/10" {...props}>{children}</code>
  );
};

const AuditSetupPage = ({ onStartAudit }: { onStartAudit: (projectId: string, saKey: string, selectedRules: any[]) => void }) => {
  const [projectId, setProjectId] = useState('');
  const [saKey, setSaKey] = useState('');
  const [checklistRules, setChecklistRules] = useState<any[]>([]);
  const [ruleStatuses, setRuleStatuses] = useState<Record<string, string>>({});

    useEffect(() => {
    // 1. Fetch Checklist Defaults
    fetch('/api/v1/checklist')
      .then(res => res.json())
      .then(data => {
        setChecklistRules(data);
        const initial: Record<string, string> = {};
        data.forEach((r: any) => {
          if (r.default_value === 'N') {
            initial[r.id] = 'No';
          } else if (r.default_value === 'O') {
            initial[r.id] = 'Out of Scope';
          } else {
            initial[r.id] = 'Yes';
          }
        });
        setRuleStatuses(initial);
      })
      .catch(err => console.error("Failed to load checklist:", err));

    // 2. Fetch Pre-filled Configuration (from .env or key.json)
    fetch('/api/v1/config')
      .then(res => res.json())
      .then(data => {
        if (data.project_id) {
            setProjectId(data.project_id);
        }
        if (data.sa_key) {
            setSaKey(data.sa_key);
        }
      })
      .catch(err => console.error("Failed to load default config:", err));
  }, []);


  const handleStatusChange = (id: string, status: string) => {
    setRuleStatuses(prev => ({ ...prev, [id]: status }));
  };

  return (
    <div className="animate-fadeIn space-y-6 pb-20">
      <PageHeader
        step="Step 01"
        title="Configuration"
        description={<p className="text-on-surface-variant text-base">Configure target environment and review checklist rules prior to the AI Audit.</p>}
        rightElement={(() => {
          const isAllChecked = checklistRules.length > 0 && checklistRules.every(r => ruleStatuses[r.id] === 'Yes' || ruleStatuses[r.id] === 'No' || ruleStatuses[r.id] === 'Out of Scope');
          return (
            <button 
              disabled={!isAllChecked}
              onClick={() => {
                if (!projectId.trim()) { alert('Please enter a GCP Project ID'); return; }
                if (!saKey.trim()) { alert('Please enter the Service Account JSON Key'); return; }
                const enrichedRules = checklistRules.map(r => ({
                   ...r,
                   user_status: ruleStatuses[r.id]
                }));
                onStartAudit(projectId, saKey, enrichedRules);
              }}
              className={cn(
                "text-white px-10 py-3.5 rounded-[2rem] font-bold text-base flex items-center gap-3 transition-all border shadow-[0_10px_40px_rgba(37,99,235,0.3)]",
                isAllChecked 
                  ? "bg-[#2563EB] border-blue-400/20 hover:scale-[1.02] hover:bg-blue-700 active:scale-[0.98]" 
                  : "bg-slate-400 border-slate-300 cursor-not-allowed opacity-60 shadow-none"
              )}
            >
              <Rocket className="w-5 h-5" />
              Start Analysis
            </button>
          );
        })()}
      />
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input + Button */}
        <div className="xl:col-span-4 flex flex-col gap-6 sticky top-6 font-medium">
          <section className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-surface-container-lowest border-b border-outline-variant/30 px-6 py-4 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-on-surface">Target Environment</h3>
                <p className="text-xs text-on-surface-variant">Specify Google Cloud Project ID and SA Key</p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {/* Step 1 */}
              <div className="relative">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0">1</div>
                  <label className="text-sm font-bold text-on-surface">Enter Google Cloud Project ID</label>
                </div>
                <div className="ml-9">
                  <input
                    type="text"
                    placeholder="e.g. acme-corp-production-01"
                    value={projectId}
                    onChange={e => setProjectId(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono shadow-inner"
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative pt-2 border-t border-outline-variant/20">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0">2</div>
                  <h4 className="text-sm font-bold text-on-surface">Run Configuration Commands in your Environment</h4>
                </div>
                <div className="ml-9">
                  <p className="text-xs text-on-surface-variant mb-3 leading-relaxed">
                    Copy and run the command below to create a service account, grant the Viewer role, and print the generated JSON key format right away.
                  </p>
                  <CommandBlock command={`# 1. Cloud Asset Inventory API 활성화
# 프로젝트 내 모든 리소스의 메타데이터를 조회하기 위해 필요한 API를 켭니다.
gcloud services enable cloudasset.googleapis.com \\
  --project=${projectId || 'PROJECT_ID'} && \\

# 2. 분석 전용 서비스 계정(Service Account) 생성
# 'ai-auditor'라는 이름의 계정을 생성하여, 개인 계정이 아닌 봇 계정으로 안전하게 접근합니다.
gcloud iam service-accounts create ai-auditor \\
  --display-name="AI Auditor" && \\

# 3. 기본 조회 권한(Viewer) 부여
# 프로젝트 내 대부분의 리소스 설정을 읽을 수 있는 권한을 서비스 계정에 할당합니다.
gcloud projects add-iam-policy-binding ${projectId || 'PROJECT_ID'} \\
  --member="serviceAccount:ai-auditor@${projectId || 'PROJECT_ID'}.iam.gserviceaccount.com" \\
  --role="roles/viewer" && \\

# 4. Cloud Asset 조회 권한(Cloud Asset Viewer) 부여
# Asset Inventory를 통해 리소스의 전체 목록과 히스토리를 쿼리할 수 있는 특수 권한을 추가합니다.
gcloud projects add-iam-policy-binding ${projectId || 'PROJECT_ID'} \\
  --member="serviceAccount:ai-auditor@${projectId || 'PROJECT_ID'}.iam.gserviceaccount.com" \\
  --role="roles/cloudasset.viewer" && \\

# 5. 서비스 계정 인증 키(JSON) 생성
# 외부 애플리케이션이나 스크립트에서 이 서비스 계정으로 로그인할 수 있도록 물리적인 키 파일을 만듭니다.
gcloud iam service-accounts keys create sa-key.json \\
  --iam-account=ai-auditor@${projectId || 'PROJECT_ID'}.iam.gserviceaccount.com && \\

# 6. 생성된 키 내용 확인
# 생성된 JSON 키 파일의 내용을 터미널에 출력합니다 (보통 이 내용을 복사하여 환경 변수 등에 설정합니다).
cat sa-key.json`} />
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="relative pt-2 border-t border-outline-variant/20">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0">3</div>
                  <label className="text-sm font-bold text-on-surface">Paste Service Account JSON Key</label>
                </div>
                <div className="ml-9">
                  <p className="text-xs text-on-surface-variant mb-3 leading-relaxed">
                    Paste the JSON output exactly as it was printed in the terminal.
                  </p>
                  <textarea
                    placeholder='{\n  "type": "service_account",\n  "project_id": "...",\n  ...'
                    value={saKey}
                    onChange={e => {
                      setSaKey(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    style={{ WebkitTextSecurity: 'disc' } as any}
                    className="w-full min-h-[160px] bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono whitespace-pre resize-none overflow-hidden shadow-inner"
                  />
                </div>
              </div>
            </div>
          </section>


        </div>

        {/* Right Column: Checklist Table */}
        <section className="xl:col-span-8 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm flex flex-col h-auto min-h-[800px]">
          <div className="bg-surface-container-lowest border-b border-outline-variant/30 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-tertiary" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-on-surface">Manual Checklist</h3>
                <p className="text-xs text-on-surface-variant">Manually review and set status for each item based on your infrastructure environment.</p>
              </div>
            </div>
            <span className="font-mono bg-slate-100 px-2.5 py-1.5 rounded text-[11px] font-black text-slate-700 border border-outline-variant/30 shadow-sm">O : Out of Scope</span>
          </div>
          
          <div className="overflow-x-auto flex-1 bg-surface-container-lowest/30">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface z-10">
                <tr className="border-b border-outline-variant/30 shadow-sm">
                  <th className="py-2 px-4 text-xs font-bold text-on-surface-variant w-16 text-center">No.</th>
                  <th className="py-2 px-4 text-xs font-bold text-on-surface-variant w-24">Type</th>
                  <th className="py-2 px-4 text-xs font-bold text-on-surface-variant w-48">Category</th>
                  <th className="py-2 px-4 text-xs font-bold text-on-surface-variant">Details</th>
                  <th className="py-2 px-4 text-xs font-bold text-on-surface-variant w-48 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                {checklistRules.filter(rule => rule.visible !== 'N').map((rule, idx) => (
                  <tr key={rule.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="py-1.5 px-4 text-sm font-mono text-on-surface-variant text-center">{idx + 1}</td>
                    <td className="py-1.5 px-4 text-sm font-bold text-on-surface-variant">
                      <span className="bg-surface-container px-2 py-0.5 rounded text-xs text-tertiary">
                        {rule.type}
                      </span>
                    </td>
                    <td className="py-1.5 px-4 text-sm font-bold text-on-surface">{rule.category}</td>
                    <td className="py-1.5 px-4 text-sm text-on-surface-variant leading-relaxed">{rule.details}</td>
                    <td className="py-1.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 min-w-[120px]">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(rule.id, 'Yes')}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all duration-200 border w-10 flex items-center justify-center shadow-sm",
                            (ruleStatuses[rule.id] === 'Yes') ? "bg-emerald-600 text-white border-emerald-700" : "bg-surface text-on-surface-variant border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low"
                          )}
                          title="Yes (Applied)"
                        >
                          Y
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(rule.id, 'No')}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all duration-200 border w-10 flex items-center justify-center shadow-sm",
                            (ruleStatuses[rule.id] === 'No') ? "bg-red-600 text-white border-red-700" : "bg-surface text-on-surface-variant border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low"
                          )}
                          title="No (Not Applied)"
                        >
                          N
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(rule.id, 'Out of Scope')}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all duration-200 border min-w-[36px] px-2 flex items-center justify-center shadow-sm",
                            (ruleStatuses[rule.id] === 'Out of Scope') ? "bg-slate-600 text-white border-slate-700" : "bg-surface text-on-surface-variant border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low"
                          )}
                          title="Out of Scope"
                        >
                          O
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

interface AuditLog {
  id: string;
  agent: string;
  type: string;
  message?: string;
  rule_id?: string;
  status?: string;
  reason?: string;
  resource?: string;
  data?: string;
}

const AuditReportPage = ({ projectId, saKey, existingReport, onProceed, isLoading, setIsLoading, onError }: { projectId: string, saKey: string, existingReport: string, onProceed: (report: string) => void, isLoading: boolean, setIsLoading: (val: boolean) => void, onError: (msg: string) => void }) => {
  const [logs, setLogs] = useState<{ id: string, message: string, type: string }[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [report, setReport] = useState<string>(existingReport || '');
  const [agentTab, setAgentTab] = useState<'compute' | 'network' | 'security' | 'database'>('compute');

  const logsContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);


  useEffect(() => {
    let isMounted = true;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let _buffer = '';

    const startStream = async () => {
      if (!projectId) return;

      if (existingReport) {
        if (isMounted) {
           setIsStreaming(false);
           setIsLoading(false);
           setLogs([{ id: 'cached', type: 'status', message: `Loaded existing report from memory.` }]);
        }
        return;
      }

      setIsStreaming(true);
      setLogs([{ id: 'init', type: 'status', message: `Initializing Asset Inventory scan for: ${projectId}...` }]);
      
      try {
        const response = await fetch('/api/v1/audit/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            sa_key: saKey,
            session_id: 'session-' + Date.now()
          })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        if (!response.body) throw new Error('No readable stream available in response.');

        reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
             if (isMounted) {
               setIsStreaming(false);
               setIsLoading(false);
             }
             break;
          }

          _buffer += decoder.decode(value, { stream: true });
          const lines = _buffer.split('\n');
          _buffer = lines.pop() || ''; 

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            if (trimmed.startsWith('data: ')) {
               const jsonStr = trimmed.substring(6);
               try {
                 const payload = JSON.parse(jsonStr);
                 if (isMounted) {
                    const logId = Math.random().toString(36).substr(2, 9);
                    
                    if (payload.type === 'analyzer_done') {
                      const fullReport = payload.report || '';

                      const section2HeaderRegex = /(\*\*|)?\[Identified Raw Resource Data\]/;
                      const section2Match = fullReport.match(section2HeaderRegex);
                      
                      if (section2Match && section2Match.index !== undefined) {
                        let section1 = fullReport.substring(0, section2Match.index).trim();
                        let section2 = fullReport.substring(section2Match.index).trim();

                        section1 = section1.replace(/#+\s*GCP Infrastructure Architecture Report\s*\n*/gi, '');
                        section1 = section1.replace(/(#+\s*)?(\*\*|)?\[Infrastructure Configuration Details\](\*\*)?\s*\n*/gi, '');
                        section2 = section2.replace(/(#+\s*)?(\*\*|)?\[Identified Raw Resource Data\](\*\*)?\s*\n*/gi, '');

                        setReport(section1);
                        setLogs(prev => [...prev.filter(l => l.type !== 'inventory'), { 
                          id: logId + '-raw', 
                          type: 'inventory', 
                          message: section2 
                        }]);
                        setLogs(prev => [...prev, { id: logId, type: 'status', message: 'Infrastructure analysis completed. (Raw resource data extracted)' }]);
                      } else {
                        setReport(fullReport);
                        setLogs(prev => [...prev, { id: logId, type: 'status', message: 'Report generated successfully.' }]);
                      }
                    } else if (payload.type === 'error') {
                      setIsStreaming(false);
                      setIsLoading(false);
                      onError(`보고서 생성 에러 발생: ${payload.message}`);
                      break; // 스트림 대기 상태 탈출
                    } else if (payload.message) {
                      setLogs(prev => [...prev, { id: logId, type: payload.type, message: payload.message }]);
                    }
                 }
               } catch (e) {
                 console.error("Failed to parse SSE payload:", jsonStr);
               }
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setLogs(prev => [...prev, { id: 'err', type: 'error', message: `Stream Error: ${err.message}` }]);
          onError(`스트림 에러가 발생했습니다: ${err.message}`);
          setIsStreaming(false);
          setIsLoading(false);
        }
      }
    };

    startStream();

    return () => {
      isMounted = false;
      if (reader) reader.cancel();
    };
  }, [projectId, saKey, existingReport]);

  return (
    <div className="animate-fadeIn space-y-6 pb-20 h-full flex flex-col">
      <PageHeader
        step="Step 02"
        title="Infra Report"
        description={<p className="text-on-surface-variant text-base">Scanning Cloud Asset Inventory to identify topologies and configurations.</p>}
      />
      
      {!isStreaming && report && (
        <ApprovalPanel
          title="Analysis Complete - Awaiting Approval"
          description="GCP Architecture analysis complete. Proceed to Compliance Check?"
          confirmText="Approve & Proceed"
          onConfirm={() => onProceed(report)}
          isLoading={isLoading}
        />
      )}
      
      <div className="flex flex-col gap-6 flex-1 min-h-[600px] overflow-hidden">
        {/* Area 1: Analysis Report */}
        <div className="premium-glass-card flex flex-col h-auto relative overflow-hidden">
           <div className="bg-white/40 border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between backdrop-blur-md">
              <span className="font-headline font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-tertiary" /> 
                Infrastructure Analysis Report
              </span>
              {isStreaming && <div className="flex items-center gap-2 text-xs font-bold text-secondary tracking-widest uppercase"><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</div>}
           </div>
          <div className="p-0 bg-surface-container-lowest/30 flex-1 h-0 flex flex-col relative">
              {report ? (
                 <>
                   <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 relative h-full">
                     {(() => {
                       const extractByName = (fullText: string, searchKey: string): string => {
                         const regex = new RegExp(`##\\s*(?:Gcp)?(?:${searchKey})(?:Analyzer)?\\b[\\s\\S]*?([\\s\\S]*?)(?=(?:##\\s*(?:Gcp)?(?:Compute|Network|Security|Database)(?:Analyzer)?\\b)|$)`, 'i');
                         const match = fullText.match(regex);
                         return match ? match[1].trim() : '';
                       };

                       const computeData = extractByName(report, 'Compute');
                       const networkData = extractByName(report, 'Network');
                       const securityData = extractByName(report, 'Security');
                       const databaseData = extractByName(report, 'Database');

                       const domains = [
                         { title: '🖥️ Compute Analysis', data: computeData || '🖥️ GcpComputeAnalyzer 데이터 대기 중...' },
                         { title: '🛰️ Network Analysis', data: networkData || '🛰️ GcpNetworkAnalyzer 데이터 대기 중...' },
                         { title: '🛡️ Security Analysis', data: securityData || '🛡️ GcpSecurityAnalyzer 데이터 대기 중...' },
                         { title: '💾 Database Analysis', data: databaseData || '💾 GcpDatabaseAnalyzer 데이터 대기 중...' }
                       ];

                       return (
                         <div className="grid grid-cols-1 gap-6 h-auto">
                           {domains.map((domain, index) => (
                             <div key={index} className="premium-glass-card p-6 bg-white/80 border border-outline-variant/30 rounded-2xl flex flex-col gap-3 min-h-[400px] h-auto overflow-y-auto">
                               <span className="font-headline font-bold text-sm text-slate-800 pb-2 border-b border-outline-variant/20 flex items-center gap-1.5 uppercase tracking-wide">
                                 {domain.title}
                               </span>
                               <div className="flex-1 overflow-y-auto custom-scrollbar text-xs">
                                 <ReactMarkdown remarkPlugins={[remarkGfm]} components={SharedMarkdownComponents}>
                                   {domain.data}
                                 </ReactMarkdown>
                               </div>
                             </div>
                           ))}
                         </div>
                       );
                     })()}
                   </div>
                 </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-outline-variant/50">
                    <Activity className="w-10 h-10 mb-4 opacity-20 animate-pulse" />
                    <span className="text-xs uppercase tracking-widest font-bold">Scanning Infrastructure Topology...</span>
                 </div>
              )}
           </div>
        </div>


      </div>
    </div>
  );
};

const AuditLivePage = ({
  projectId,
  saKey,
  rules,
  infrastructureReport,
  logs,
  setLogs,
  isStreaming,
  setIsStreaming,
  remediationMap,
  setRemediationMap,
  expandedRules,
  setExpandedRules,
  onError
}: {
  projectId: string;
  saKey: string;
  rules: any[];
  infrastructureReport: string;
  logs: AuditLog[];
  setLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  isStreaming: boolean;
  setIsStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  remediationMap: Record<string, string>;
  setRemediationMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  expandedRules: Record<string, boolean>;
  setExpandedRules: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onError: (msg: string) => void;
}) => {
  const [activeAgent, setActiveAgent] = useState<string>('initializer');
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resultsContainerRef.current) {
      resultsContainerRef.current.scrollTop = resultsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    let isMounted = true;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let _buffer = '';

    const startStream = async () => {
      if (!projectId || logs.length > 0 || isStreaming) return;
      setIsStreaming(true);
      setLogs([{ id: 'init', agent: 'system', type: 'status', message: `Initializing audit pipeline for project: ${projectId}...` }]);
      
      try {
        const response = await fetch('/api/v1/audit/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            sa_key: saKey,
            infrastructure_report: infrastructureReport,
            checklist_items: rules,
            session_id: 'session-' + Date.now()
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        if (!response.body) {
          throw new Error('No readable stream available in response.');
        }

        reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
             if (isMounted) {
                setIsStreaming(false);
                setLogs(prev => [...prev, { id: Date.now().toString(), agent: 'system', type: 'complete', message: 'Audit stream has gracefully closed.' }]);
             }
             break;
          }

          _buffer += decoder.decode(value, { stream: true });
          const lines = _buffer.split('\n');
          _buffer = lines.pop() || ''; // keep incomplete line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            if (trimmed.startsWith('data: ')) {
               const jsonStr = trimmed.substring(6);
               try {
                 const payload = JSON.parse(jsonStr);
                 
                 if (isMounted) {
                    const logId = Math.random().toString(36).substr(2, 9);
                    const newLog: AuditLog = { ...payload, id: logId };
                    
                    if (newLog.agent && newLog.agent !== 'system') {
                      setActiveAgent(newLog.agent);
                    }

                    if (newLog.type === 'remediation_plan' && newLog.data && newLog.rule_id) {
                      setRemediationMap(prev => ({ ...prev, [newLog.rule_id!]: newLog.data! }));
                    } else if (newLog.type === 'error') {
                      onError(`평가 실패 에러: ${newLog.message}`);
                      setIsStreaming(false);
                      break; // 스트림 대기 상태 탈출
                    }
                    
                    setLogs(prev => [...prev, newLog]);
                 }
               } catch (e) {
                 console.error("Failed to parse SSE payload:", jsonStr);
               }
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setLogs(prev => [...prev, { id: 'err', agent: 'system', type: 'error', message: `Stream Error: ${err.message}` }]);
          onError(`평가 스트림 에러가 발생했습니다: ${err.message}`);
          setIsStreaming(false);
        }
      }
    };

    startStream();

    return () => {
      isMounted = false;
      if (reader) reader.cancel();
    };
  }, [projectId, rules, infrastructureReport]);

  const evalResults = logs.filter(l => l.type === 'result');

  // 3-way Status Calculation (Match, Mismatch, Skipped)
  const consistencyMap = rules.reduce((acc, rule) => {
    const res = evalResults.find(r => r.rule_id === rule.id);
    const userValue = (rule as any).user_status || 'Yes'; // 'Yes' | 'No' | 'Out of Scope'
    
    if (userValue === 'Out of Scope' || userValue === 'O') {
      acc[rule.id] = 'Skipped';
      return acc;
    }

    if (!res) {
      acc[rule.id] = 'Skipped'; // 응답 대기 중 (또는 임시 Unknown)
      return acc;
    }

    // 에이전트 판단 가공
    const uiStatus = res.status;

    if (uiStatus === 'Match' || uiStatus === 'PASS' || uiStatus === 'APPLIED') {
      acc[rule.id] = 'Match';
    } else if (uiStatus === 'Mismatch' || uiStatus === 'FAIL' || uiStatus === 'NOT_APPLIED') {
      acc[rule.id] = 'Mismatch';
    } else {
      acc[rule.id] = 'Skipped';
    }
    return acc;
  }, {} as Record<string, 'Match' | 'Mismatch' | 'Skipped'>);

  const matchedCount = Object.values(consistencyMap).filter(v => v === 'Match').length;
  const mismatchedCount = Object.values(consistencyMap).filter(v => v === 'Mismatch').length;
  const inconclusiveCount = Object.values(consistencyMap).filter(v => v === 'Skipped').length;

  return (
    <div className="animate-fadeIn space-y-6 pb-20 h-full flex flex-col">
      <PageHeader
        step="Step 03"
        title="Checklist"
        description={(
          <p className="text-on-surface-variant text-base">
            Evaluating GCP region and service infrastructure consistency (Matching diagnostic results) for <span className="font-mono text-primary font-bold">{projectId}</span>
          </p>
        )}
        rightElement={null}
      />
      
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        
        {/* Top: Consistency Dashboard */}
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-6 relative overflow-hidden backdrop-blur-sm">
           <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
           
           <div className="relative z-10 w-full md:w-auto">
              <h3 className="font-headline font-bold text-xl text-on-surface mb-1.5 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" /> Evaluation Dashboard
              </h3>
            <p className="text-sm text-on-surface-variant font-medium">Real-time infrastructure policy compliance status summary</p>
           </div>
           
          <div className="relative z-10 flex flex-nowrap items-center gap-6 md:gap-14 bg-surface-container-lowest/80 p-4 px-10 rounded-2xl border border-outline-variant/30 shadow-inner justify-between">
            <div className="flex items-center gap-14 pr-10 border-r border-outline-variant/30">
              <div className="flex flex-col items-center">
                <div className="text-4xl font-mono font-black text-emerald-600 tracking-tighter">
                  {matchedCount}
                </div>
                <span className="text-[10px] font-black text-emerald-600/80 uppercase tracking-widest flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> MATCHED
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-4xl font-mono font-black text-red-600 tracking-tighter">
                  {mismatchedCount}
                </div>
                <span className="text-[10px] font-black text-red-600/80 uppercase tracking-widest flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> MISMATCHED
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-4xl font-mono font-black text-slate-500 tracking-tighter">
                  {inconclusiveCount}
                </div>
                <span className="text-[10px] font-black text-slate-500/80 uppercase tracking-widest flex items-center gap-1 mt-1">
                  <HelpCircle className="w-3 h-3" /> INCONCLUSIVE
                </span>
              </div>
            </div>

            {/* Removed APPLIED / NOT APPLIED statistics */}
           </div>
        </div>

        {/* Guide Text for O and ? */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 px-5 flex items-center justify-between text-xs text-on-surface-variant font-medium tracking-tight">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><span className="font-mono font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-outline-variant/30">O</span> : Out of Scope (범위 제외)</span>
            <span className="flex items-center gap-1.5"><span className="font-mono font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-outline-variant/30">?</span> : Inconclusive (판단 불가 / 정보 부족)</span>
          </div>
          <span className="text-outline-variant">※ User Y/N 과 Agent Y/N 이 일치하면 Match, 다르면 Mismatch</span>
        </div>

        {/* List of Cards */}
        <div ref={resultsContainerRef} className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar pb-10 space-y-5">
           {rules.length === 0 ? (
            <div className="w-full h-80 flex flex-col items-center justify-center text-outline-variant/60 bg-surface border-2 border-outline-variant/20 rounded-2xl border-dashed">
               {isStreaming ? (
                <>
                  <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary opacity-50" />
                  <p className="text-sm font-bold tracking-tight">Evaluator Agent is analyzing resources...</p>
                </>
               ) : (
                  <p className="text-sm font-medium">No items to evaluate.</p>
               )}
             </div>
           ) : (
             rules.map((rule, idx) => {
               const ruleResults = evalResults.filter(r => r.rule_id === rule.id);
               const isExpanded = !!expandedRules[rule.id];
                const isWaiting = ruleResults.length === 0;
               const status = consistencyMap[rule.id];
               const userValue = (rule as any).user_status || 'Yes';
               const userMapped = userValue === 'Yes' ? 'Y' : userValue === 'No' ? 'N' : userValue;

               const displayContent = (() => {
                 if (ruleResults.length === 0) return '';
                 const res = ruleResults[0];

                 const bp = extractSection(res.reason, 'Google Cloud Best Practices') || extractSection(res.reason, 'Google Cloud Best Practice');
                 const tfCode = remediationMap[rule.id];

                 // Extract Reasoning cleanly
                 let reasoning = extractSection(res.reason, 'Reasoning') || extractSection(res.reason, '상세 이유');

                 // Fallback if regex failed and JSON wasn't detected
                 if (!reasoning) {
                   reasoning = res.reason
                     .replace(new RegExp(`(?:\\*\\*|- |### |\\* )?Google Cloud Best Practice(?:s)?[\\s\\S]*`, 'gi'), '')
                     .replace(/^(?:\\*\\*|- |### |\\* )?Summary\\s*:.*$/gmi, '')
                     .replace(/^(?:\\*\\*|- |### |\\* )?Status\\s*:.*$/gmi, '')
                     .trim();
                 }

                 let content = "";

                 // 1. Agent Decision Reason (Always shown unless User marked N/Out of Scope)
                 const isUserSkipped = userValue === 'No' || userValue === 'N' || userValue === 'Out of Scope' || userValue === 'OUT OF SCOPE';
                 if (reasoning && !isUserSkipped) {
                   content += `### 🤖 Agent Decision Reason\n\n${reasoning}\n\n`;
                 }

                 // If we have Remediation Code (Remediator output), it naturally contains
                 // both "💡 Google Cloud Best Practice" and "🛠️ Remediation Code (Terraform / gcloud)".
                 // So we just append it!
                 if (tfCode && tfCode.trim()) {
                   content += `${tfCode.trim()}\n\n`;
                 } else {
                   // Only show Evaluator's Best Practice if Remediator didn't run
                   if (bp && bp.trim()) {
                     content += `### 💡 Google Cloud Best Practice\n\n${bp.trim()}\n\n`;
                   }
                 }

                 return content.trim();
               })();

               const hasContent = displayContent.trim().length > 0;

               const themeClass = isWaiting ? "border-outline-variant/20" :
                 status === 'Match' ? "border-emerald-500/20 bg-emerald-50/[0.03]" :
                   status === 'Mismatch' ? "border-red-500/30 bg-red-50/[0.03]" :
                 "border-slate-400/30 bg-slate-50/[0.03]"; // Inconclusive

                return (
                  <div key={rule.id} className={cn("bg-surface border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm relative", themeClass)}>
                     {!isWaiting && (
                         <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", 
                           status === 'Match' ? "bg-emerald-600" :
                             status === 'Mismatch' ? "bg-red-600" :
                               status === 'Mismatch' ? "bg-red-600" : 
                           "bg-slate-400")} />
                     )}
                     <div 
                      className={cn("w-full transition-colors",
                        hasContent && status === 'Mismatch' ? "hover:bg-red-500/[0.04] cursor-pointer" :
                          hasContent && status === 'Match' ? "hover:bg-emerald-500/[0.04] cursor-pointer" :
                        hasContent ? "hover:bg-slate-500/[0.04] cursor-pointer" : "")}
                       onClick={() => hasContent && setExpandedRules(p => ({...p, [rule.id]: !isExpanded}))}
                     >
                       <div className="px-6 py-5 flex flex-col md:flex-row items-start gap-10">
                         {/* LEFT: Rule Details & Integrated Reasoning */}
                         <div className="flex-1 min-w-0">
                           <div className="flex flex-wrap items-center gap-3 mb-2">
                             <span className="px-2.5 py-1 rounded-md text-[9px] uppercase font-black tracking-widest bg-surface-container-high text-tertiary shadow-sm">{rule.type}</span>
                             <span className="text-[10px] font-bold text-on-surface bg-surface-container-lowest px-2.5 py-1 border border-outline-variant/30 rounded-full">{rule.category}</span>
                           </div>
                           <h4 className="text-[16px] font-bold text-on-surface tracking-tight leading-snug">{rule.details}</h4>
                         </div>

                         {/* RIGHT: Unified Horizontal Comparison Row (Grid-like Sub-division Left alignment) */}
                         <div className="flex flex-row items-stretch gap-8 shrink-0 border-l border-outline-variant/20 pl-10 font-black text-[14px] self-stretch py-2">
                           <div className="flex items-center justify-start gap-3 w-40 shrink-0">
                             <span className="text-on-surface-variant/70 text-[13px] uppercase tracking-wider w-12 shrink-0">USER</span>
                             <span className={cn("text-[16px] font-black uppercase tracking-tight whitespace-nowrap w-24 shrink-0 flex items-center justify-start", (userValue === 'Yes' || userValue === 'Y') ? 'text-emerald-700' : (userValue === 'No' || userValue === 'N') ? 'text-red-700' : 'text-slate-600')}>
                               {userValue === 'Yes' ? 'Y' : userValue === 'No' ? 'N' : userValue === 'Out of Scope' || userValue === 'OUT OF SCOPE' ? 'OUT OF SCOPE' : 'OUT OF SCOPE'}
                             </span>
                           </div>

                           <div className="w-[2.5px] h-full bg-gradient-to-b from-transparent via-outline-variant to-transparent" />

                           <div className="flex items-center justify-start gap-3 w-28 shrink-0">
                             <span className="text-on-surface-variant/70 text-[13px] uppercase tracking-wider w-14 shrink-0">AGENT</span>
                             {isWaiting ? (
                                <div className="text-[10px] text-slate-500/50 flex items-center font-black w-12 shrink-0 h-10 flex items-center justify-start"><Loader2 className="w-3.5 h-3.5 animate-spin" /></div>
                             ) : (
                                <span className={cn("text-[16px] font-black uppercase tracking-tight w-12 shrink-0 flex items-center justify-start",
                                  consistencyMap[rule.id] === 'Match' ? ((userValue === 'Yes' || userValue === 'Y') ? 'text-emerald-700' : 'text-red-700') :
                                    consistencyMap[rule.id] === 'Mismatch' ? ((userValue === 'Yes' || userValue === 'Y') ? 'text-red-700' : 'text-emerald-700') : 'text-slate-600')}>
                                  {consistencyMap[rule.id] === 'Match' ? ((userValue === 'Yes' || userValue === 'Y') ? 'Y' : 'N') :
                                    consistencyMap[rule.id] === 'Mismatch' ? ((userValue === 'Yes' || userValue === 'Y') ? 'N' : 'Y') : '?'}
                               </span>
                             )}
                           </div>

                           <div className="w-[2.5px] h-full bg-gradient-to-b from-transparent via-outline-variant to-transparent" />

                           <div className="flex items-center justify-start gap-3 w-44 shrink-0">
                             <span className="text-on-surface-variant/70 text-[13px] uppercase tracking-wider w-16 shrink-0">STATUS</span>
                             {isWaiting ? (
                               <div className="text-[10px] text-slate-500/50 flex items-center font-black w-24 shrink-0 h-10 flex items-center justify-start"><Loader2 className="w-3.5 h-3.5 animate-spin" /></div>
                             ) : (
                               <div className={cn(
                                 "flex items-center justify-start gap-2 text-[15px] font-black uppercase tracking-wider w-24 shrink-0 h-10",
                                 status === 'Match' ? "text-emerald-700" : status === 'Mismatch' ? "text-red-700" : "text-slate-600"
                               )}>
                                 {status}
                               </div>
                             )}
                           </div>

                           {hasContent ? (
                             <ChevronRight className={cn("w-6 h-6 transition-transform duration-300 text-outline-variant ml-2 self-center", isExpanded && "rotate-90")} />
                           ) : (
                             <div className="w-6 h-6 ml-2 self-center" />
                           )}
                         </div>
                       </div>
                       
                      {status === 'Mismatch' && !isWaiting && ruleResults[0] && (
                         <div className="px-10 pb-5 w-full">
                           <div className="p-4 bg-red-600/5 border border-red-500/10 rounded-xl flex items-start gap-4 animate-fadeIn">
                             <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" strokeWidth={2} />
                             <div className="flex-1 min-w-0">
                              <span className="text-[11px] font-black text-red-700 uppercase tracking-tighter block mb-1">Mismatch Detected</span>
                               <p className="text-[13px] text-red-950/90 leading-relaxed font-semibold">
                                 {(extractSection(ruleResults[0].reason, 'Summary') || ruleResults[0].reason.split('\n').find(line => line.trim().length > 0 && !line.startsWith('Status:') && !line.startsWith('User Configuration:')) || "").replace(/^\s*(?:- \*\*|- |### |\* |-)?\s*(?:\*\*)?Summary(?:\*\*)?\s*:\s*/i, '').trim()}
                               </p>
                             </div>
                           </div>
                         </div>
                       )}
                     </div>


                    <div className={cn("grid transition-[grid-template-rows] duration-500 ease-in-out bg-surface-container-lowest/20", isExpanded && hasContent ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                      <div className="overflow-hidden">
                        <div className="px-4 md:px-6 pb-4 pt-4 border-t border-outline-variant/10">
                          {ruleResults.length > 0 && (
                            <div className="mb-2 animate-slideUp">

                              <div className="space-y-6">
                                {ruleResults.map(res => (
                                  displayContent ? (
                                    <div key={`res-${res.id}`} className="markdown-content text-on-surface-variant text-base leading-relaxed font-medium p-0 animate-slideUp">
                                      <div className="hidden">
                                        <div className="flex items-center gap-12">
                                          <div className="flex items-center gap-2">
                                            <div className={cn("w-2 h-2 rounded-full", (res.status === 'PASS' || res.status === 'APPLIED') ? "bg-emerald-500" : "bg-red-500 text-on-surface")}></div>
                                            <span className="text-[11px] font-black uppercase text-on-surface/80">{res.status}</span>
                                        </div>
                                           <span className="text-[10px] font-bold uppercase text-on-surface-variant">Agent: {res.agent || 'Evaluator'}</span>
                                         </div>
                                       </div>
                                       <div className="p-2">
                                         <div className="markdown-content text-on-surface-variant text-[14px] leading-relaxed font-medium">
                                            <ReactMarkdown 
                                              remarkPlugins={[remarkGfm]} 
                                              components={{
                                                ...SharedMarkdownComponents,
                                                h2: ({ node, ...props }: any) => <h2 className="text-xl font-headline font-bold text-on-surface mt-6 first:mt-0 mb-3 pb-2 border-b border-outline-variant/30" {...props} />,
                                                h3: ({ node, ...props }: any) => <h3 className="text-lg font-headline font-semibold text-on-surface mt-4 first:mt-0 mb-2" {...props} />,
                                                code: TerraformCodeBlock
                                              }}
                                            >
                                             {displayContent}
                                           </ReactMarkdown>
                                         </div>
                                       </div>
                                     </div>
                                  ) : null
                                ))}
                              </div>
                            </div>
                          )}

                          {false && (
                            <div className="animate-slideUp" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                              <h5 className="text-[11px] font-black text-tertiary uppercase tracking-[0.2em] mb-5 flex items-center gap-3 border-b border-tertiary/10 pb-3">
                                <Code className="w-5 h-5" /> Remediation Infrastructure-as-Code
                              </h5>
                              <div className="mt-2 bg-[#1b1c1e] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                                <div className="bg-[#2a2b2e] px-8 py-4 flex items-center justify-between border-b border-white/5">
                                  <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">TERRAFORM BLUEPRINT</span>
                                  </div>
                                </div>
                                <div 
                                  className="p-8 overflow-x-auto text-[#e1e1e6] max-h-[500px] overflow-y-auto custom-scrollbar"
                                  dangerouslySetInnerHTML={{ __html: `<pre><code class="font-mono text-[13px] leading-relaxed break-words">${remediationMap[rule.id].replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                     </div>
                   </div>
                );
             })
           )}
        </div>
      </div>
    </div>
  );
};


export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('gcp_advisor');
  const [activePage, setActivePage] = useState<Page>('audit_setup');
  const [mappings, setMappings] = useState<MappingItem[]>([]);
  const [checklist, setChecklist] = useState<VerificationItem[]>([]);
  const [analysisReport, setAnalysisReport] = useState<string>("");
  const [mappingReport, setMappingReport] = useState<string>("");
  const [terraformReport, setTerraformReport] = useState<string>("");
  const [terraformFiles, setTerraformFiles] = useState<{ [filename: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [awaitingApproval, setAwaitingApproval] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState<string>("Analyzing architecture...");

  // GCP Advisor States
  const [auditProjectId, setAuditProjectId] = useState<string>('');
  const [auditSaKey, setAuditSaKey] = useState<string>('');
  const [auditRules, setAuditRules] = useState<any[]>([]);
  const [infrastructureReport, setInfrastructureReport] = useState<string>('');

  // Persistent Audit Live State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditIsStreaming, setAuditIsStreaming] = useState<boolean>(false);
  const [auditRemediationMap, setAuditRemediationMap] = useState<Record<string, string>>({});
  const [auditExpandedRules, setAuditExpandedRules] = useState<Record<string, boolean>>({});

  // Error Modal States
  const [isErrorModalOpen, setIsErrorModalOpen] = useState<boolean>(false);
  const [errorModalMessage, setErrorModalMessage] = useState<string>("");

  const showErrorModal = (message: string) => {
    setErrorModalMessage(message);
    setIsErrorModalOpen(true);
  };

  const handleStartAudit = (projectId: string, saKey: string, rules: any[]) => {
      setAuditProjectId(projectId);
      setAuditSaKey(saKey);
      setAuditRules(rules);
      
      setLoadingMsg("🔍 Initializing CAI Scanner and Authenticating credentials...");
      setIsLoading(true);
      setActivePage('audit_report');
  };

  const handleAnalysisComplete = (report: string) => {
      setInfrastructureReport(report);
    // Reset Audit persistence for new session
    setAuditLogs([]);
    setAuditIsStreaming(false);
    setAuditRemediationMap({});
    setAuditExpandedRules({});

      setLoadingMsg("✅ Approval complete. Launching Evaluator & Remediator Agents...");
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          setActivePage('audit_live');
      }, 2000);
  };

  const handleRunAgent = async (promptText: string, metadata?: any, file?: { type: string, base64: string } | null, targetAgent: string = "aws_analyzer") => {
    setIsLoading(true);

    const userMsg: ChatMessage = { role: 'user', text: promptText };
    setMessages(prev => [...prev, userMsg]);

    let finalPrompt = promptText;
    if (metadata) {
      finalPrompt += `\n\n[📋 Target Business & Operational Goals for QA Audit]\n`;
      finalPrompt += `- Service Criticality: ${metadata.serviceCriticality}\n`;
      finalPrompt += `- Target RTO: ${metadata.rto}\n`;
      finalPrompt += `- Global User Base: ${metadata.globalUserBase}\n`;
      finalPrompt += `- Expected Traffic Scale: ${metadata.trafficScale}\n`;
      finalPrompt += `- Traffic Pattern: ${metadata.trafficPattern}\n`;
      finalPrompt += `- Availability (SLA) Goal: ${metadata.availabilityGoal}\n`;
      finalPrompt += `- Architecture Style: ${metadata.architectureStyle}\n`;
      finalPrompt += `- Orchestration Platform: ${metadata.orchestrationTool}\n`;
      finalPrompt += `- Infrastructure as Code (IaC) Applied: ${metadata.isIaC ? 'Yes' : 'No'}\n`;
      finalPrompt += `- Immutable Infrastructure (No direct admin access): ${metadata.isImmutable ? 'Yes' : 'No'}\n`;
      finalPrompt += `- Centralized Logging & Monitoring: ${metadata.isCentralizedLogging ? 'Yes' : 'No'}\n`;
      finalPrompt += `\n(Agent Instruction: You MUST rigorously evaluate the attached architecture against the 34 Quality Audit Checklist items based on these stated goals.)`;
    }

    const parts: any[] = [{ text: finalPrompt }];
    if (file) {
      parts.push({
        inlineData: { mimeType: file.type, data: file.base64 }
      });
    }

    try {
      const res = await fetch("/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName: targetAgent, userId: "cloud_arch_user", sessionId: "main_session_01", newMessage: { role: "user", parts: parts } })
      });

      if (!res.ok) throw new Error(`Backend Server Error (${res.status})`);

      const data = await res.json();

      if (Array.isArray(data)) {
        let fullText = "";
        let bestText = "";
        data.forEach((event: any) => {
          if (event?.content?.parts) {
            let eventText = "";
            event.content.parts.forEach((part: any) => {
              if (part.text && !part.functionCall) eventText += part.text + "\n";
            });
            if (eventText.includes("### 📊") && eventText.includes("```json")) {
              bestText = eventText;
            } else if (!bestText && eventText.trim().length > 0) {
              fullText += eventText + "\n";
            }
          }
        });
        
        if (bestText) fullText = bestText;

        if (fullText) {
          setAwaitingApproval(true);
          const cleanText = fullText.replace("[AWAITING_USER_APPROVAL]", "").trim();

          setMessages(prev => [...prev, { role: 'agent', text: cleanText }]);

          let navigated = false;
          let hasChecklistData = false;

          if (fullText.includes("```json")) {
            const blocks = fullText.split("```json");
            for (let i = 1; i < blocks.length; i++) {
              let jsonStr = "";
              try {
                jsonStr = blocks[i].split("```")[0];
                const lastBraceIndex = jsonStr.lastIndexOf("}");
                if (lastBraceIndex !== -1) jsonStr = jsonStr.substring(0, lastBraceIndex + 1);

                const cleanedJson = jsonStr.replace(/,\s*([\]}])/g, "$1");
                const parsed = JSON.parse(cleanedJson);

                const checklistData = parsed.checklist || parsed.checklist_results;
                if (checklistData && Array.isArray(checklistData)) {
                  const flatChecklist = checklistData.flatMap((node: any) => {
                    if (node.items && Array.isArray(node.items)) {
                      return node.items.map((item: any) => ({
                        id: item.id || item.check || Math.random().toString(),
                        title: item.check || item.title || "N/A",
                        description: item.details || item.description || item.note || "",
                        status: (item.status?.toLowerCase() === 'warning' || item.status?.toLowerCase() === 'error' || item.status?.toLowerCase() === 'fail') ? 'warning' : 
                                (item.status?.toLowerCase() === 'complete' || item.status?.toLowerCase() === 'passed' || item.status?.toLowerCase() === 'pass') ? 'complete' : 'pending'
                      }));
                    } else {
                      return [{
                        id: node.id || node.check || node.title || Math.random().toString(),
                        title: node.check || node.title || "N/A",
                        description: node.details || node.description || node.note || "",
                        status: (node.status?.toLowerCase() === 'warning' || node.status?.toLowerCase() === 'error' || node.status?.toLowerCase() === 'fail') ? 'warning' : 
                                (node.status?.toLowerCase() === 'complete' || node.status?.toLowerCase() === 'passed' || node.status?.toLowerCase() === 'pass') ? 'complete' : 'pending'
                      }];
                    }
                  });
                  setChecklist(flatChecklist);
                  hasChecklistData = flatChecklist.length > 0;
                }

                const mappingData = parsed.mappings || parsed.mappings_results;
                if (mappingData) {
                  setMappings(mappingData);
                  
                  // Extract non-JSON markdown for the report, cutting off at the System Integration Data section
                  let textOnly = cleanText;
                  const cutoffPoints = [
                    textOnly.indexOf("### ⚙️ System Integration Data"),
                    textOnly.indexOf("```json")
                  ].filter(index => index !== -1);
                  
                  if (cutoffPoints.length > 0) {
                    // Find the earliest occurrence to slice from
                    const sliceIndex = Math.min(...cutoffPoints);
                    textOnly = textOnly.substring(0, sliceIndex).trim();
                  }
                  
                  if (textOnly) {
                    setMappingReport(textOnly);
                  }

                  setActivePage('mapping'); 
                  navigated = true;
                }
              } catch (e) {
                console.error("⚠️ JSON Parse Error:", e);
              }
            }
          }

          const files: { [key: string]: string } = {};
          let tfReportStr = "";

          const segments = fullText.split("### ");
          for (let i = 1; i < segments.length; i++) {
            const segment = segments[i];
            const lines = segment.split("\n");
            let header = lines[0].trim().replace("[", "").replace("]", "");

            // Parser: If '📝' symbol or 'Terraform Architecture Analysis' header exists, treat as report
            if (header.includes("📝") || header.toLowerCase().includes("analysis")) {
               tfReportStr = lines.slice(1).join("\n").trim();
               continue;
            }

            let filename = header;
            if (!filename.includes(".tf")) filename = filename + ".tf"; 
            
            if (segment.includes("```hcl")) {
              files[filename] = segment.split("```hcl")[1].split("```")[0];
            } else if (segment.includes("```terraform")) {
              files[filename] = segment.split("```terraform")[1].split("```")[0];
            }
          }

          if (tfReportStr) {
            setTerraformReport(tfReportStr);
          }

          if (Object.keys(files).length === 0) {
              const codeBlockRegex = /```(?:hcl|terraform)\n([\s\S]*?)```/g;
              let match;
              let fileIndex = 1;
              while ((match = codeBlockRegex.exec(fullText)) !== null) {
                  files[`main_${fileIndex}.tf`] = match[1].trim();
                  fileIndex++;
              }
          }

          if (Object.keys(files).length > 0) {
            setTerraformFiles(files);
            setActivePage('terraform');
            navigated = true;
          }

          if (!navigated && (cleanText.includes("### 📊") || cleanText.includes("### 🌐") || hasChecklistData)) {
            setAnalysisReport(cleanText);
            setActivePage('analysis');
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'agent', text: "❌ API Error: " + e.message }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden w-full bg-background font-body text-on-surface">
      <TopBar activePage={activePage} onPageChange={setActivePage} appMode={appMode} onModeChange={setAppMode} />
      
      <div className="flex-1 overflow-x-hidden overflow-y-auto relative blueprint-grid">
        <main className="min-h-full flex flex-col relative">
          <div className="flex-1">
          <div className="p-6 md:p-8 lg:p-12 max-w-[1600px] w-full mx-auto">
              <AnimatePresence mode="wait">
              <motion.div key={activePage} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                {activePage === 'upload' && <UploadPage onAnalyze={(d, m, f) => { setLoadingMsg("🔍 Analyzing AWS infrastructure architecture..."); handleRunAgent(d, m, f, "aws_analyzer"); }} isLoading={isLoading} />}
                {activePage === 'analysis' && <AnalysisPage report={analysisReport} checklistItems={checklist} awaitingApproval={awaitingApproval} onConfirm={() => {
                  try {
                    const safeChecklist = Array.isArray(checklist) ? JSON.stringify(checklist) : "[]";
                    handleRunAgent(`Please map (translate) the following AWS architecture analysis results to GCP resources.\n\n${analysisReport}\n\n${safeChecklist}`, null, null, "gcp_translator");
                  } catch (e) {
                    handleRunAgent(`Please map (translate) the following AWS architecture analysis results to GCP resources.\n\n${analysisReport}`, null, null, "gcp_translator");
                  }
                }} onFeedback={(text) => handleRunAgent(text, null, null, "aws_analyzer")} isLoading={isLoading} setLoadingMsg={setLoadingMsg} />}
                {activePage === 'mapping' && <MappingPage mappings={mappings} report={mappingReport} onConfirm={() => {
                  try {
                    const safeMappings = Array.isArray(mappings) ? JSON.stringify(mappings) : "[]";
                    const generatorPrompt = `The following is comprehensive architecture data for migrating from AWS to GCP. Please analyze this data thoroughly and generate production-ready enterprise GCP Terraform code.

--- [1. Original Architecture Specs & Analysis Data (System Integration Data)] ---
${analysisReport}

--- [2. GCP-Native Architecture Optimization Design Guide] ---
${mappingReport}

--- [3. Resource 1:1 Mapping Transformation Table] ---
${safeMappings}`;

                    handleRunAgent(generatorPrompt, null, null, "tf_generator");
                  } catch (e) {
                  }
                }} awaitingApproval={awaitingApproval} isLoading={isLoading} />}
                {activePage === 'terraform' && <TerraformPage files={terraformFiles} report={terraformReport} />}
                {activePage === 'audit_setup' && <AuditSetupPage onStartAudit={handleStartAudit} />}
                {activePage === 'audit_report' && <AuditReportPage projectId={auditProjectId} saKey={auditSaKey} existingReport={infrastructureReport} onProceed={handleAnalysisComplete} isLoading={isLoading} setIsLoading={setIsLoading} onError={showErrorModal} />}
                  {activePage === 'audit_live' && (
                    <AuditLivePage
                      projectId={auditProjectId}
                      saKey={auditSaKey}
                      rules={auditRules}
                      infrastructureReport={infrastructureReport}
                      logs={auditLogs}
                      setLogs={setAuditLogs}
                      isStreaming={auditIsStreaming}
                      setIsStreaming={setAuditIsStreaming}
                      remediationMap={auditRemediationMap}
                      setRemediationMap={setAuditRemediationMap}
                      expandedRules={auditExpandedRules}
                      setExpandedRules={setAuditExpandedRules}
                      onError={showErrorModal}
                    />
                  )}
              </motion.div>
            </AnimatePresence>
            {isLoading && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center z-[100] animate-fadeIn">
                <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4 shadow-xl"></div>
                <div className="bg-white px-10 py-5 rounded-full shadow-2xl border border-gray-100 flex items-center gap-4 animate-slideUp">
                  <div className="w-3 h-3 bg-primary rounded-full animate-ping"></div>
                  <p className="text-slate-800 font-headline font-bold text-lg tracking-wide">{loadingMsg || "Analyzing appropriate cloud infrastructure..."}</p>
                </div>
              </div>
            )}

            {/* Error Modal */}
            <AnimatePresence>
              {isErrorModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col"
                  >
                    <div className="p-8 flex items-center gap-4 border-b border-gray-100 bg-white">
                      <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center shrink-0 border border-red-100">
                        <AlertTriangle className="w-6 h-6 text-red-600" strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="text-lg font-headline font-bold text-slate-900">API 오류 발생</h3>
                        <p className="text-xs text-on-surface-variant mt-1">시스템에서 문제가 발견되었습니다.</p>
                      </div>
                    </div>
                    
                    <div className="p-8">
                      <div className="p-4 bg-slate-50 rounded-xl border border-gray-100 mb-6 flex items-center gap-3">
                         <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 animate-pulse"></div>
                         <p className="text-sm font-medium text-slate-700 break-words leading-relaxed flex-1">
                          {errorModalMessage}
                         </p>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          Gemini API 할당량이 초과되었거나 일시적인 네트워크 장애일 수 있습니다. 잠시 후 다시 시도해 주세요.
                        </p>
                        
                        <button
                          onClick={() => setIsErrorModalOpen(false)}
                          className="mt-4 w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                        >
                          확인 및 닫기
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}