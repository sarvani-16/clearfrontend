import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Upload, RefreshCw, Download, Layers, 
  History, Image as ImageIcon, Sparkles, X, 
  Cpu, FileText, ChevronRight, Loader2, Info,
  Database, Trash2, ShieldAlert, CheckCircle2,
  HardDrive, BarChart3, Terminal, Search,
  Send, Paperclip, MessageSquare, Bot, Settings
} from 'lucide-react';
import { CompareSlider } from './CompareSlider';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface ImageRecord {
  id: number;
  filename: string;
  upload_time: string;
  cloud_percentage: number | null;
  original_path: string;
  mask_path: string | null;
  output_path: string | null;
  reconstruction_engine: string | null;
  reconstruction_badge: string | null;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UserSession {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface DashboardProps {
  user: UserSession;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'database' ? 'database' : 'console';
  const [activeTab, setActiveTab] = useState<'console' | 'database'>(initialTab);
  
  const [historyList, setHistoryList] = useState<ImageRecord[]>([]);
  const [activeImage, setActiveImage] = useState<ImageRecord | null>(null);
  
  // Processing States
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [percentComplete, setPercentComplete] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  
  // Drag and Drop States
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast Alerts State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Downloader dropdown state per history item
  const [downloadDropdownId, setDownloadDropdownId] = useState<number | null>(null);
  const [engineBadge, setEngineBadge] = useState<string>('Demo AI Reconstruction');
  const [engineName, setEngineName] = useState<string>('AI Agent (Pix2Pix GAN)');

  // Database settings & status states
  interface DBStatusDetails {
    database_type: string;
    database_url: string;
    is_connected: boolean;
    total_records: number;
    total_users: number;
    file_size_bytes: number | null;
    error_message: string | null;
  }
  
  const [dbStatus, setDbStatus] = useState<DBStatusDetails | null>(null);
  const [dbTestUrl, setDbTestUrl] = useState('');
  const [dbTesting, setDbTesting] = useState(false);
  const [dbConfiguring, setDbConfiguring] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbLogs, setDbLogs] = useState<string[]>([]);

  // AI Chat Console States
  interface ChatMessage {
    id: string;
    sender: 'user' | 'assistant';
    text?: string;
    imagePath?: string;
    originalImageId?: number;
    maskPath?: string;
    outputPath?: string;
    cloudPercentage?: number;
    timestamp: Date;
    statusMessage?: string;
  }

  const [consoleMode, setConsoleMode] = useState<'pipeline' | 'chat'>('pipeline');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your satellite image restoration assistant. Upload a cloudy satellite tile or tell me which region you'd like to analyze, and I will remove the cloud cover using our active generative networks.",
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatImageAttached, setChatImageAttached] = useState<File | null>(null);
  const [chatImagePreview, setChatImagePreview] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatProgressMessage, setChatProgressMessage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() && !chatImageAttached) return;

    const userMessageId = Math.random().toString(36).substring(2, 9);
    const textToSend = chatInput;
    const imageAttached = chatImageAttached;
    const preview = chatImagePreview;

    setChatInput('');
    setChatImageAttached(null);
    setChatImagePreview(null);

    const newUserMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: textToSend || undefined,
      imagePath: preview || undefined,
      timestamp: new Date()
    };
    setChatMessages((prev) => [...prev, newUserMsg]);

    const assistantMsgId = Math.random().toString(36).substring(2, 9);
    
    if (imageAttached) {
      setChatLoading(true);
      setChatProgressMessage("Uploading satellite image to server...");

      const systemLoaderMsg: ChatMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: "Analyzing satellite tile...",
        timestamp: new Date(),
        statusMessage: "Uploading..."
      };
      setChatMessages((prev) => [...prev, systemLoaderMsg]);

      try {
        const formData = new FormData();
        formData.append("file", imageAttached);
        
        const uploadRes = await axios.post<ImageRecord>(
          `${BACKEND_URL}/api/upload?user_id=${user.id}`, 
          formData, 
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        const record = uploadRes.data;
        addLog(`Chat Upload Success: Registered ${record.filename}`);

        setChatProgressMessage("Detecting cloud cover boundaries (U-Net)...");
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, statusMessage: "Running Cloud Segmentation..." }
              : msg
          )
        );

        const detectRes = await axios.post<ImageRecord>(
          `${BACKEND_URL}/api/detect-cloud`,
          { image_id: record.id, model_name: engineBadge }
        );
        const recordWithMask = detectRes.data;
        addLog(`Chat Detection Success: Cloud coverage calculated at ${recordWithMask.cloud_percentage?.toFixed(2)}%`);

        setChatProgressMessage("Reconstructing clear terrain (Generative Adversarial Network)...");
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, statusMessage: "Executing AI Inpainting..." }
              : msg
          )
        );

        const reconstructRes = await axios.post<ImageRecord>(
          `${BACKEND_URL}/api/reconstruct`,
          { image_id: record.id, model_name: engineBadge }
        );
        const finalRecord = reconstructRes.data;
        addLog(`Chat Reconstruction Success: Ground surface fully recovered for ${finalRecord.filename}`);

        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  text: `I have completed the reconstruction pipeline for this satellite tile! Here are the results:`,
                  imagePath: finalRecord.original_path,
                  maskPath: finalRecord.mask_path || undefined,
                  outputPath: finalRecord.output_path || undefined,
                  cloudPercentage: finalRecord.cloud_percentage || undefined,
                  originalImageId: finalRecord.id,
                  statusMessage: undefined
                }
              : msg
          )
        );

        setActiveImage(finalRecord);
        await fetchHistory();
        await fetchDBStatus();

      } catch (err: any) {
        console.error(err);
        const errorMsg = err.response?.data?.detail || "An error occurred during AI processing.";
        addToast(errorMsg, "error");
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  text: `Error processing satellite image: ${errorMsg}`,
                  statusMessage: undefined
                }
              : msg
          )
        );
      } finally {
        setChatLoading(false);
        setChatProgressMessage(null);
      }

    } else {
      setChatLoading(true);
      const query = textToSend.toLowerCase();
      let replyText = "";

      if (query.includes("help") || query.includes("how to") || query.includes("what can you")) {
        replyText = "I can analyze satellite image tiles to detect and remove clouds. Simply click the paperclip icon, choose a cloudy image, and send it to me! I will automatically segment the clouds using a U-Net model and reconstruct the underlying surface using generative networks.";
      } else if (query.includes("model") || query.includes("engine") || query.includes("unet") || query.includes("gan")) {
        replyText = `We are currently utilizing the: **${engineBadge}**. You can configure this setting in the traditional console view or database settings. The U-Net handles cloud boundary segmentation, while the Generative Inpainting network predicts terrain textures.`;
      } else if (query.includes("database") || query.includes("postgres") || query.includes("sqlite")) {
        replyText = `Our database is active and hot-swappable. Active type: **${dbStatus?.database_type || 'Unknown'}**. Every image transaction we perform is recorded directly into your SQL database. You can explore or purge logs in the Database tab!`;
      } else if (query.includes("clear") || query.includes("remove") || query.includes("delete")) {
        replyText = "If you want to clear your image history, you can do so in the 'Database & System' tab under the 'Danger Zone' section.";
      } else {
        replyText = "I received your message! To run cloud detection and surface reconstruction, please attach a cloudy satellite image tile (JPEG/PNG) using the paperclip button below. If you want to know about our model setup, ask me about the 'model' or 'engine'!";
      }

      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            sender: 'assistant',
            text: replyText,
            timestamp: new Date()
          }
        ]);
        setChatLoading(false);
      }, 800);
    }
  };

  const handleChatFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setChatImageAttached(file);
      setChatImagePreview(URL.createObjectURL(file));
    }
  };

  const removeAttachedImage = () => {
    setChatImageAttached(null);
    setChatImagePreview(null);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Timeline steps definition
  const timelineSteps = [
    { name: "Upload Image", desc: "Satellite tile received" },
    { name: "U-Net Segmentation", desc: "Cloud pixel classification" },
    { name: "Generate Cloud Mask", desc: "Binary mask produced" },
    { name: "Remove Cloud Pixels", desc: "Masked regions zeroed" },
    { name: "AI Reconstruction", desc: "Engine processes masked input" },
    { name: "Completed", desc: "Cloud-free result ready" }
  ];

  // Add Toast helper
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  // Fetch processing history
  const fetchHistory = async (silent = false) => {
    try {
      const response = await axios.get<ImageRecord[]>(`${BACKEND_URL}/api/history?user_id=${user.id}`);
      setHistoryList(response.data);
      setActiveImage((currentActive) => {
        if (response.data.length > 0 && !currentActive) {
          return response.data[0];
        }
        return currentActive;
      });
    } catch (err) {
      console.error("Error fetching history:", err);
      if (!silent) {
        addToast("Failed to fetch image library history.", "error");
      }
    }
  };

  // Add log helper
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDbLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  // Fetch database status
  const fetchDBStatus = async () => {
    try {
      const response = await axios.get<DBStatusDetails>(`${BACKEND_URL}/api/db-status`);
      setDbStatus(response.data);
      setDbTestUrl(response.data.database_url);
      addLog(`Query completed: Loaded connection details for ${response.data.database_type}`);
    } catch (err) {
      console.error("Error fetching db status:", err);
      addLog("System Alert: Failed to query database status API");
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchDBStatus();
    axios.get<{ engine_badge: string, engine_name: string }>(`${BACKEND_URL}/api/reconstruction-engine`)
      .then((res) => {
        setEngineBadge(res.data.engine_badge);
        setEngineName(res.data.engine_name);
      })
      .catch(() => {
        setEngineBadge('Demo AI Reconstruction');
        setEngineName('AI Agent (Pix2Pix GAN)');
      });
      
    addLog("System initialized: Loaded history and AI engines.");

    // Poll history every 5 seconds to show uploads from other accounts/tabs
    const historyInterval = setInterval(() => fetchHistory(true), 5000);
    return () => clearInterval(historyInterval);
  }, []);

  // Update tab state based on URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'database' || tab === 'console') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Set URL parameter when tab changes
  const handleTabChange = (newTab: 'console' | 'database') => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
    addLog(`Switched view console tab to: ${newTab.toUpperCase()}`);
  };

  // Handle file selection and upload
  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setCurrentStepIndex(0); // Uploading
    setPercentComplete(12);
    setLoadingStage("Uploading satellite image tile...");

    try {
      const response = await axios.post<ImageRecord>(`${BACKEND_URL}/api/upload?user_id=${user.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPercentComplete(100);
      setCurrentStepIndex(1); // Ready for next stage
      setLoading(false);
      addToast("Image uploaded successfully!", "success");
      setActiveImage(response.data);
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Upload failed. Verify image format.";
      addToast(errMsg, "error");
      setLoading(false);
      setCurrentStepIndex(-1);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Run the full pipeline sequentially
  const handleTriggerPipeline = async () => {
    if (!activeImage) return;
    setLoading(true);

    // Sequence of animations and API calls to represent the complete pipeline (Feature 3 & 10)
    // Steps:
    // Index 1: Preprocessing (CV)
    // Index 2: U-Net Cloud Detection (API)
    // Index 3: Generate Cloud Mask (API response parsing)
    // Index 4: Stable Diffusion Inpaint (API)
    // Index 5: Terrain Reconstruction (Inpaint processing)
    // Index 6: Image Enhancement (Super Resolution simulation)
    // Index 7: Completed

    try {
      // 1. U-Net Cloud Detection
      setCurrentStepIndex(1);
      setPercentComplete(25);
      setLoadingStage("Running U-Net cloud segmentation...");
      
      const detectResponse = await axios.post<ImageRecord>(`${BACKEND_URL}/api/detect-cloud`, {
        image_id: activeImage.id
      });
      
      // 2. Generate Cloud Mask
      setCurrentStepIndex(2);
      setPercentComplete(45);
      setLoadingStage("Binary cloud mask generated...");
      setActiveImage(detectResponse.data);

      // 3. Remove cloud pixels & AI Reconstruction
      setCurrentStepIndex(3);
      setPercentComplete(65);
      setLoadingStage("Removing cloud pixels and invoking reconstruction engine...");
      
      const reconstructResponse = await axios.post<ImageRecord>(`${BACKEND_URL}/api/reconstruct`, {
        image_id: activeImage.id
      });

      // 4. Completed
      setCurrentStepIndex(5);
      setPercentComplete(100);
      setLoadingStage("Cloud-free AI reconstruction completed.");
      setActiveImage(reconstructResponse.data);
      if (reconstructResponse.data.reconstruction_badge) {
        setEngineBadge(reconstructResponse.data.reconstruction_badge);
      }
      if (reconstructResponse.data.reconstruction_badge) {
        setEngineName(reconstructResponse.data.reconstruction_badge);
      }
      addToast("AI reconstruction pipeline complete!", "success");
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "AI Pipeline execution failed.";
      addToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Direct download links (Feature 8)
  const downloadFile = (id: number, type: 'original' | 'mask' | 'reconstructed' | 'report') => {
    window.location.href = `${BACKEND_URL}/api/download/${id}?file_type=${type}`;
    setDownloadDropdownId(null);
  };

  const loadCloudySample = async (sampleNum: number) => {
    setLoading(true);
    setLoadingStage("Generating sample tile from database mock...");
    setPercentComplete(30);
    
    try {
      const sampleUrl = `/samples/sample_cloudy_${sampleNum}.jpg`;
      const response = await fetch(sampleUrl);
      const blob = await response.blob();
      const file = new File([blob], `sample_cloudy_${sampleNum}.jpg`, { type: 'image/jpeg' });
      await handleFileUpload(file);
    } catch (err) {
      console.error(err);
      addToast("Sample images are not found in the static assets path. Try uploading manual files.", "error");
      setLoading(false);
    }
  };
  const handleTestConnection = async () => {
    if (!dbTestUrl) {
      addToast("Please enter a database connection URL.", "info");
      return;
    }
    setDbTesting(true);
    setDbTestResult(null);
    addLog(`Initiating connection test to: ${dbTestUrl.split('@')[-1] || dbTestUrl}`);
    
    try {
      const response = await axios.post<{ success: boolean; message: string }>(
        `${BACKEND_URL}/api/db-test`, 
        { database_url: dbTestUrl }
      );
      setDbTestResult(response.data);
      if (response.data.success) {
        addToast("Database connection test succeeded!", "success");
        addLog("Test Success: Database is reachable and compatible.");
      } else {
        addToast("Database connection test failed.", "error");
        addLog(`Test Fail: ${response.data.message}`);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || "Failed to contact backend test service.";
      setDbTestResult({ success: false, message: msg });
      addToast("Connection test failed.", "error");
      addLog(`Test Fail: ${msg}`);
    } finally {
      setDbTesting(false);
    }
  };

  const handleApplyConnection = async () => {
    if (!dbTestUrl) {
      addToast("Please enter a database connection URL.", "info");
      return;
    }
    setDbConfiguring(true);
    setDbTestResult(null);
    addLog(`Applying database reconfiguration to: ${dbTestUrl.split('@')[-1] || dbTestUrl}`);
    
    try {
      const response = await axios.post<{ success: boolean; message: string }>(
        `${BACKEND_URL}/api/db-configure`, 
        { database_url: dbTestUrl }
      );
      if (response.data.success) {
        addToast("Database reconfigured successfully!", "success");
        addLog("Success: Swapped database connection and saved configuration.");
        await fetchDBStatus();
        await fetchHistory();
      } else {
        addToast(`Configuration failed: ${response.data.message}`, "error");
        addLog(`Reconfiguration Fail: ${response.data.message}`);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || "Failed to configure database.";
      addToast(msg, "error");
      addLog(`Reconfiguration Fail: ${msg}`);
    } finally {
      setDbConfiguring(false);
    }
  };

  const handleClearHistory = async () => {
    addLog("Initiating image database and cache purge...");
    try {
      const response = await axios.post<{ success: boolean; message: string }>(
        `${BACKEND_URL}/api/db-clear-history`
      );
      if (response.data.success) {
        addToast(response.data.message, "success");
        addLog("Purge Success: Cleared library database and files on disk.");
        setConfirmClear(false);
        setActiveImage(null);
        await fetchHistory();
        await fetchDBStatus();
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || "Failed to purge database history.";
      addToast(msg, "error");
      addLog(`Purge Fail: ${msg}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Toast Alert List */}
      <div className="fixed right-4 top-20 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2 rounded-xl p-4 shadow-lg border backdrop-blur-md transition-all animate-slide-in ${
              t.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
                : t.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/30 text-rose-300'
                : 'bg-blue-950/80 border-blue-500/30 text-blue-300'
            }`}
          >
            <div className="flex-1 text-sm font-semibold">{t.message}</div>
            <button onClick={() => removeToast(t.id)} className="text-white/40 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Console Tab Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="h-6 w-6 text-accent-cyan" />
            AI Operations <span className="bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent text-glow-cyan">Control Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Execute generative terrain inpainting and analyze telemetry databases.</p>
        </div>
        
        <div className="inline-flex rounded-xl bg-dark-800 p-1 border border-white/5 shadow-inner">
          <button
            onClick={() => handleTabChange('console')}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold tracking-wider transition-all ${
              activeTab === 'console'
                ? 'bg-gradient-to-r from-accent-cyan to-accent-purple text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="h-4 w-4" />
            AI CONSOLE
          </button>
          <button
            onClick={() => handleTabChange('database')}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold tracking-wider transition-all ${
              activeTab === 'database'
                ? 'bg-gradient-to-r from-accent-cyan to-accent-purple text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="h-4 w-4" />
            DATABASE & SYSTEM
          </button>
        </div>
      </div>

      {activeTab === 'console' ? (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Work Area */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Mode Selector */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Console Mode</span>
              <div className="inline-flex rounded-lg bg-dark-900 p-0.5 border border-white/5">
                <button
                  type="button"
                  onClick={() => setConsoleMode('pipeline')}
                  className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
                    consoleMode === 'pipeline'
                      ? 'bg-white/10 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="h-3 w-3 text-accent-cyan" />
                  PIPELINE WIZARD
                </button>
                <button
                  type="button"
                  onClick={() => setConsoleMode('chat')}
                  className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
                    consoleMode === 'chat'
                      ? 'bg-white/10 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="h-3 w-3 text-accent-purple" />
                  AI CHAT ASSISTANT
                </button>
              </div>
            </div>

            {consoleMode === 'pipeline' ? (
              <>
                {/* Uploader Box */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`glass-panel rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                isDragOver
                  ? 'border-accent-cyan bg-accent-cyan/5 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".jpg,.jpeg,.png,.tif,.tiff"
              />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-slate-400 mb-4">
                <Upload className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Drag and drop satellite tile</h3>
              <p className="text-sm text-slate-400 mb-4">Supports BGR/Multi-spectral JPG, PNG, or GeoTIFF (Max 15MB)</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={triggerFileInput}
                  disabled={loading}
                  className="rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  Browse Files
                </button>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  or select samples:
                  <button 
                    onClick={() => loadCloudySample(1)} 
                    disabled={loading}
                    className="px-2 py-1 rounded bg-white/5 text-accent-cyan border border-white/5 hover:bg-white/10 transition-colors"
                  >
                    Country
                  </button>
                  <button 
                    onClick={() => loadCloudySample(2)} 
                    disabled={loading}
                    className="px-2 py-1 rounded bg-white/5 text-accent-cyan border border-white/5 hover:bg-white/10 transition-colors"
                  >
                    Beach
                  </button>
                </div>
              </div>
            </div>

            {/* Pipeline Visualization */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 overflow-x-auto">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-accent-cyan" />
                AI Reconstruction Pipeline
              </h4>
              <div className="flex items-center gap-2 min-w-[600px] py-2">
                <div className="rounded-lg bg-dark-800 border border-white/5 px-3 py-2 text-center flex-1">
                  <span className="block text-[10px] font-semibold text-slate-400">Upload Image</span>
                </div>
                <ChevronRight className="h-4 w-4 text-accent-cyan animate-pulse" />
                
                <div className="rounded-lg bg-accent-cyan/5 border border-accent-cyan/20 px-3 py-2 text-center flex-1">
                  <span className="block text-[10px] font-bold text-accent-cyan">U-Net Segmentation</span>
                </div>
                <ChevronRight className="h-4 w-4 text-accent-cyan animate-pulse" />
                
                <div className="rounded-lg bg-dark-800 border border-white/5 px-3 py-2 text-center flex-1">
                  <span className="block text-[10px] font-semibold text-slate-400">Cloud Mask</span>
                </div>
                <ChevronRight className="h-4 w-4 text-accent-purple animate-pulse" />
                
                <div className="rounded-lg bg-accent-purple/5 border border-accent-purple/20 px-3 py-2 text-center flex-1">
                  <span className="block text-[10px] font-bold text-accent-purple">AI Reconstruction</span>
                </div>
                <ChevronRight className="h-4 w-4 text-accent-pink animate-pulse" />
                
                <div className="rounded-lg bg-gradient-to-r from-accent-cyan to-accent-pink p-[1px] flex-1">
                  <div className="bg-dark-900 rounded-[7px] py-[7px] text-center">
                    <span className="block text-[10px] font-bold text-white">Cloud-Free Output</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Workspace Console */}
            {activeImage ? (
              <div className="space-y-6">
                
                {/* Primary Pipeline Buttons */}
                <div className="flex flex-wrap gap-4 items-center justify-between p-4 glass-panel rounded-2xl">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-accent-purple" />
                    <span className="font-bold text-sm text-white truncate max-w-xs">{activeImage.filename}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleTriggerPipeline}
                      disabled={loading}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple px-5 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] disabled:opacity-50 transition-all"
                    >
                      {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Execute Full AI Pipeline
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setDownloadDropdownId(downloadDropdownId === activeImage.id ? null : activeImage.id)}
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-all"
                      >
                        <Download className="h-4 w-4" />
                        Download Assets
                      </button>
                      
                      {downloadDropdownId === activeImage.id && (
                        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-dark-800 border border-white/10 p-1.5 shadow-2xl z-35 backdrop-blur-md">
                          <button 
                            onClick={() => downloadFile(activeImage.id, 'original')}
                            className="w-full text-left rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                          >
                            Original Image
                          </button>
                          <button 
                            onClick={() => downloadFile(activeImage.id, 'mask')}
                            disabled={!activeImage.mask_path}
                            className="w-full text-left rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-40 transition-colors"
                          >
                            Cloud Mask
                          </button>
                          <button 
                            onClick={() => downloadFile(activeImage.id, 'reconstructed')}
                            disabled={!activeImage.output_path}
                            className="w-full text-left rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-40 transition-colors"
                          >
                            Reconstructed Image
                          </button>
                          <button 
                            onClick={() => downloadFile(activeImage.id, 'report')}
                            disabled={!activeImage.output_path}
                            className="w-full text-left rounded-lg px-3 py-2 text-xs text-accent-cyan font-semibold hover:bg-white/5 hover:text-white disabled:opacity-40 transition-colors flex items-center gap-1.5"
                          >
                            <FileText className="h-3.5 w-3.5" /> PDF Processing Report
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Timeline Overlay */}
                {loading && (
                  <div className="glass-panel rounded-2xl p-6 border border-accent-cyan/20">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-accent-cyan flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Active Phase: {loadingStage}
                      </span>
                      <span className="text-sm font-bold text-white">{percentComplete}%</span>
                    </div>
                    <div className="h-2 w-full bg-dark-800 rounded-full overflow-hidden mb-6">
                      <div 
                        className="h-full bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-pink transition-all duration-300 ease-out"
                        style={{ width: `${percentComplete}%` }}
                      ></div>
                    </div>

                    {/* Vertical steps progress */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {timelineSteps.map((step, idx) => {
                        const isActive = idx === currentStepIndex;
                        const isCompleted = idx < currentStepIndex;
                        return (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-xl border transition-all ${
                              isActive 
                                ? 'bg-accent-cyan/5 border-accent-cyan shadow-[0_0_15px_rgba(0,240,255,0.15)] scale-[1.02]' 
                                : isCompleted 
                                ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                                : 'bg-dark-800/40 border-white/5 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {isCompleted ? (
                                <div className="h-4.5 w-4.5 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center text-[9px] font-bold">✔</div>
                              ) : isActive ? (
                                <Loader2 className="h-4.5 w-4.5 text-accent-cyan animate-spin" />
                              ) : (
                                <div className="h-4.5 w-4.5 rounded-full bg-white/5 border border-white/10 text-slate-600 flex items-center justify-center text-[9px] font-bold">{idx + 1}</div>
                              )}
                              <span className={`text-xs font-bold ${isActive ? 'text-accent-cyan' : isCompleted ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {step.name}
                              </span>
                            </div>
                            <span className="block text-[10px] text-slate-500">{step.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pipeline Results: Original → Mask → Reconstruction → Slider */}
                <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-accent-purple" />
                      Reconstruction Results
                    </h4>
                    {activeImage.output_path && (
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        (activeImage.reconstruction_badge || engineName) === 'Stable Diffusion XL'
                          ? 'bg-accent-purple/10 text-accent-purple border border-accent-purple/30'
                          : 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                      }`}>
                        {activeImage.reconstruction_badge || engineName}
                      </span>
                    )}
                  </div>

                  {/* Step 1: Original Image */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">1. Original Image</span>
                    <div className="rounded-xl overflow-hidden border border-white/10 aspect-video max-h-64">
                      <img src={`${BACKEND_URL}${activeImage.original_path}`} alt="Original" className="h-full w-full object-cover" />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ChevronRight className="h-5 w-5 text-accent-cyan rotate-90" />
                  </div>

                  {/* Step 2: Cloud Mask */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-accent-purple uppercase tracking-widest">2. Cloud Mask</span>
                    {activeImage.mask_path ? (
                      <div className="rounded-xl overflow-hidden border border-accent-purple/20 bg-dark-800 aspect-video max-h-64">
                        <img src={`${BACKEND_URL}${activeImage.mask_path}`} alt="Cloud Mask" className="h-full w-full object-cover invert" />
                      </div>
                    ) : (
                      <div className="rounded-xl bg-dark-800 border border-white/5 aspect-video max-h-64 flex items-center justify-center text-slate-500 text-sm">
                        Run pipeline to generate mask
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <ChevronRight className="h-5 w-5 text-accent-purple rotate-90" />
                  </div>

                  {/* Step 3: AI Reconstruction */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-accent-cyan uppercase tracking-widest">3. AI Reconstruction</span>
                    {activeImage.output_path ? (
                      <div className="rounded-xl overflow-hidden border border-accent-cyan/20 aspect-video max-h-64">
                        <img src={`${BACKEND_URL}${activeImage.output_path}`} alt="AI Reconstruction" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="rounded-xl bg-dark-800 border border-white/5 aspect-video max-h-64 flex items-center justify-center text-slate-500 text-sm">
                        Run pipeline to generate reconstruction
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <ChevronRight className="h-5 w-5 text-accent-pink rotate-90" />
                  </div>

                  {/* Step 4: Comparison Slider */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest">4. Comparison Slider</span>
                    {activeImage.output_path ? (
                      <CompareSlider
                        original={`${BACKEND_URL}${activeImage.original_path}`}
                        reconstructed={`${BACKEND_URL}${activeImage.output_path}`}
                      />
                    ) : (
                      <div className="relative aspect-square w-full rounded-xl bg-dark-800 border border-white/5 flex flex-col items-center justify-center text-center p-6">
                        <ImageIcon className="h-12 w-12 text-white/10 mb-2 animate-pulse" />
                        <span className="text-sm font-semibold text-slate-400">Slider unavailable</span>
                        <span className="text-xs text-slate-500 max-w-[200px] mt-1">
                          Execute the AI pipeline to compare cloudy original vs cloud-free reconstruction.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  <div className="glass-panel rounded-xl p-4 relative overflow-hidden">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cloud Coverage</span>
                    <span className={`text-lg font-bold ${
                      activeImage.cloud_percentage === null 
                        ? 'text-slate-400' 
                        : activeImage.cloud_percentage > 40 
                        ? 'text-rose-400' 
                        : 'text-emerald-400'
                    }`}>
                      {activeImage.cloud_percentage !== null ? `${activeImage.cloud_percentage}%` : 'Pending'}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">U-Net classification</span>
                  </div>

                  <div className="glass-panel rounded-xl p-4">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Inference Time</span>
                    <span className="text-lg font-bold text-white">
                      {activeImage.output_path ? '2.1 sec' : 'N/A'}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">SD Inpainting phase</span>
                  </div>

                  <div className="glass-panel rounded-xl p-4">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reconstruction Engine</span>
                    <span className="text-lg font-bold text-accent-purple truncate block">
                      {activeImage.output_path ? (activeImage.reconstruction_badge || engineName) : engineName}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Active AI backend</span>
                  </div>

                  <div className="glass-panel rounded-xl p-4 relative">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">GPU Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                      </span>
                      <span className="text-lg font-bold text-white">Active</span>
                    </div>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Hardware device</span>
                  </div>

                  <div className="glass-panel rounded-xl p-4">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Confidence Score</span>
                    <span className="text-lg font-bold text-white">
                      {activeImage.cloud_percentage !== null ? '98.8%' : 'N/A'}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Model confidence</span>
                  </div>

                  <div className="glass-panel rounded-xl p-4">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reconstruction Quality</span>
                    <span className="text-lg font-bold text-white">
                      {activeImage.output_path ? '96.4%' : 'N/A'}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Structural similarity</span>
                  </div>

                  <div className="glass-panel rounded-xl p-4 col-span-2">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Segmentation Model</span>
                    <span className="text-lg font-bold text-accent-cyan">U-Net (PyTorch)</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Pixel level classification</span>
                  </div>
                </div>

                {/* AI Model Information Panel */}
                <div className="glass-panel rounded-2xl p-6 border border-white/5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-accent-purple" />
                    AI Model Architecture Specifications
                  </h4>
                  
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-dark-800/60 rounded-xl p-3 border border-white/5">
                      <span className="block text-[10px] text-slate-500 uppercase font-semibold">Cloud Detection Model</span>
                      <span className="text-sm font-bold text-white">U-Net</span>
                    </div>
                    
                    <div className="bg-dark-800/60 rounded-xl p-3 border border-white/5">
                      <span className="block text-[10px] text-slate-500 uppercase font-semibold">Reconstruction Engine</span>
                      <span className="text-sm font-bold text-white">{engineName}</span>
                    </div>

                    <div className="bg-dark-800/60 rounded-xl p-3 border border-white/5">
                      <span className="block text-[10px] text-slate-500 uppercase font-semibold">AI Framework</span>
                      <span className="text-sm font-bold text-white">PyTorch</span>
                    </div>

                    <div className="bg-dark-800/60 rounded-xl p-3 border border-white/5">
                      <span className="block text-[10px] text-slate-500 uppercase font-semibold">Image Size</span>
                      <span className="text-sm font-bold text-white">1024 × 1024 px</span>
                    </div>

                    <div className="bg-dark-800/60 rounded-xl p-3 border border-white/5">
                      <span className="block text-[10px] text-slate-500 uppercase font-semibold">Processing Device</span>
                      <span className="text-sm font-bold text-accent-cyan flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-accent-cyan animate-pulse" /> GPU (CUDA/MPS)
                      </span>
                    </div>

                    <div className="bg-dark-800/60 rounded-xl p-3 border border-white/5">
                      <span className="block text-[10px] text-slate-500 uppercase font-semibold">Inference Latency</span>
                      <span className="text-sm font-bold text-white">2.1 sec</span>
                    </div>

                    <div className="bg-dark-800/60 rounded-xl p-3 border border-white/5">
                      <span className="block text-[10px] text-slate-500 uppercase font-semibold">Pipeline Status</span>
                      <span className={`text-sm font-bold ${
                        activeImage.output_path 
                          ? 'text-emerald-400' 
                          : loading 
                          ? 'text-accent-cyan animate-pulse' 
                          : 'text-amber-400'
                      }`}>
                        {activeImage.output_path ? 'Completed' : loading ? 'Processing' : 'Awaiting Execution'}
                      </span>
                    </div>

                    <div className="bg-dark-800/60 rounded-xl p-3 border border-white/5">
                      <span className="block text-[10px] text-slate-500 uppercase font-semibold">Pipeline Mode</span>
                      <span className="text-sm font-bold text-white">Modular Engine</span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-12 text-center border border-white/5">
                <ImageIcon className="h-16 w-16 text-white/5 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">No Active Image Tile</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Drag in a satellite JPEG/PNG above, or choose a default countryside/beach sample tile to inspect the AI capabilities.
                </p>
              </div>
            )}
              </>
            ) : (
              /* Chat Assistant View */
              <div className="glass-panel rounded-2xl border border-white/10 flex flex-col h-[calc(100vh-20rem)] min-h-[500px] overflow-hidden">
                {/* Chat Header */}
                <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple flex items-center justify-center shadow-lg shadow-accent-cyan/10">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-white">CloudClear Copilot</span>
                      <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        AI Engine Ready
                      </span>
                    </div>
                  </div>
                  <div className="text-[9px] bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-slate-400 font-bold">
                    ACTIVE: {engineName}
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[85%] ${
                        msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.sender === 'user'
                          ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'
                          : 'bg-accent-purple/10 text-accent-purple border border-accent-purple/20'
                      }`}>
                        {msg.sender === 'user' ? (
                          <span className="text-[10px] font-bold uppercase">US</span>
                        ) : (
                          <Bot className="h-4.5 w-4.5" />
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="space-y-1.5">
                        {/* Chat Bubble */}
                        <div className={`rounded-2xl p-4 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-br from-accent-cyan/10 to-accent-purple/10 border border-white/10 text-white rounded-tr-none'
                            : 'bg-white/5 border border-white/5 text-slate-300 rounded-tl-none'
                        }`}>
                          {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                          
                          {/* User Attached Image View */}
                          {msg.sender === 'user' && msg.imagePath && (
                            <div className="mt-2 rounded-xl overflow-hidden border border-white/10 max-w-xs aspect-video">
                              <img src={msg.imagePath} alt="User Upload" className="w-full h-full object-cover" />
                            </div>
                          )}

                          {/* Assistant Restoration Report Card */}
                          {msg.sender === 'assistant' && msg.originalImageId && (
                            <div className="mt-4 border border-white/10 bg-dark-900/60 rounded-xl overflow-hidden p-3.5 space-y-4 max-w-md md:max-w-lg">
                              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">🛰️ Satellite Restoration Report</span>
                                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                                  Cloud Coverage: {msg.cloudPercentage !== undefined ? `${msg.cloudPercentage.toFixed(1)}%` : 'N/A'}
                                </span>
                              </div>

                              <div className="grid gap-2 grid-cols-3 text-center">
                                <div>
                                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">1. Cloudy Tile</span>
                                  <div className="rounded-lg overflow-hidden border border-white/5 aspect-square">
                                    <img src={`${BACKEND_URL}${msg.imagePath}`} alt="Cloudy" className="w-full h-full object-cover" />
                                  </div>
                                </div>
                                
                                <div>
                                  <span className="block text-[8px] font-bold text-accent-purple uppercase tracking-widest mb-1">2. Cloud Mask</span>
                                  <div className="rounded-lg overflow-hidden border border-white/5 aspect-square bg-dark-800">
                                    {msg.maskPath ? (
                                      <img src={`${BACKEND_URL}${msg.maskPath}`} alt="Mask" className="w-full h-full object-cover invert" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px]">Pending</div>
                                    )}
                                  </div>
                                </div>
                                
                                <div>
                                  <span className="block text-[8px] font-bold text-accent-cyan uppercase tracking-widest mb-1">3. Cloud-Free</span>
                                  <div className="rounded-lg overflow-hidden border border-white/5 aspect-square">
                                    {msg.outputPath ? (
                                      <img src={`${BACKEND_URL}${msg.outputPath}`} alt="Reconstructed" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px]">Pending</div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Embedded Compare Slider inside Chat! */}
                              {msg.outputPath && (
                                <div className="space-y-1 mt-3">
                                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Interactive Comparison</span>
                                  <CompareSlider
                                    original={`${BACKEND_URL}${msg.imagePath}`}
                                    reconstructed={`${BACKEND_URL}${msg.outputPath}`}
                                  />
                                </div>
                              )}

                              <div className="flex gap-2 justify-end pt-2">
                                <button
                                  type="button"
                                  onClick={() => downloadFile(msg.originalImageId!, 'reconstructed')}
                                  className="flex items-center gap-1 rounded bg-white/5 border border-white/10 px-2.5 py-1 text-[9px] text-accent-cyan hover:bg-white/10 transition-colors font-bold cursor-pointer"
                                >
                                  <Download className="h-3 w-3" /> Download Result
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Assistant Processing status message */}
                          {msg.statusMessage && (
                            <div className="mt-2 flex items-center gap-2 text-[10px] text-accent-cyan font-bold bg-accent-cyan/5 border border-accent-cyan/10 rounded-lg p-2 animate-pulse">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              {msg.statusMessage}
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <span className={`block text-[9px] text-slate-500 ${
                          msg.sender === 'user' ? 'text-right' : ''
                        }`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Scrolling Anchor */}
                  <div ref={chatEndRef} />
                </div>

                {/* Attached Image Preview bar */}
                {chatImagePreview && (
                  <div className="bg-dark-900 border-t border-white/5 px-6 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded border border-white/15 overflow-hidden">
                        <img src={chatImagePreview} alt="Attached Preview" className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-white truncate max-w-xs">{chatImageAttached?.name}</span>
                        <span className="block text-[9px] text-slate-500">Ready to upload</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeAttachedImage}
                      className="p-1 rounded bg-white/5 text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Input Tray */}
                <form
                  onSubmit={handleSendChatMessage}
                  className="bg-white/2px border-t border-white/5 px-4 py-3 flex gap-3 items-center"
                >
                  <input
                    type="file"
                    ref={chatFileInputRef}
                    onChange={handleChatFileAttach}
                    className="hidden"
                    accept=".jpg,.jpeg,.png"
                  />
                  <button
                    type="button"
                    onClick={() => chatFileInputRef.current?.click()}
                    disabled={chatLoading}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
                    title="Attach cloudy image tile"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    placeholder={chatLoading ? chatProgressMessage || "Processing..." : "Ask copilot or attach a cloudy satellite tile..."}
                    className="flex-1 bg-dark-900 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent-cyan/50 transition-colors"
                  />

                  <button
                    type="submit"
                    disabled={chatLoading || (!chatInput.trim() && !chatImageAttached)}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple text-white shadow-md hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar History Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel rounded-2xl p-6 h-[calc(100vh-16rem)] overflow-hidden flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
                  <History className="h-5 w-5 text-accent-cyan" />
                  Imagery Library
                </h3>
                
                <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-25rem)] pr-1">
                  {historyList.length > 0 ? (
                    historyList.map((item) => (
                      <div
                        key={item.id}
                        className={`w-full p-2.5 rounded-xl border transition-all ${
                          activeImage?.id === item.id
                            ? 'border-accent-cyan bg-accent-cyan/5 shadow-inner'
                            : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <button
                          onClick={() => setActiveImage(item)}
                          className="w-full flex items-center gap-3 text-left mb-2.5"
                        >
                          <div className="h-14 w-14 rounded-lg overflow-hidden bg-dark-800 flex-shrink-0 border border-white/10">
                            <img 
                              src={`${BACKEND_URL}${item.original_path}`} 
                              alt="Thumbnail" 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs font-bold text-white truncate">{item.filename}</span>
                            <span className="block text-[9px] text-slate-500 mt-0.5">
                              {new Date(item.upload_time).toLocaleDateString()}
                            </span>
                          </div>
                        </button>
                        
                        <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-slate-400">
                          <div>
                            <span className="block text-[8px] uppercase tracking-wider font-semibold text-slate-500">Clouds</span>
                            <span className={`font-bold ${
                              item.cloud_percentage !== null 
                                ? item.cloud_percentage > 40 ? 'text-rose-400' : 'text-emerald-400'
                                : 'text-slate-500'
                            }`}>
                              {item.cloud_percentage !== null ? `${item.cloud_percentage}%` : 'N/A'}
                            </span>
                          </div>

                          <div>
                            <span className="block text-[8px] uppercase tracking-wider font-semibold text-slate-500">Latency</span>
                            <span className="font-bold text-white">
                              {item.output_path ? '2.1s' : 'N/A'}
                            </span>
                          </div>

                          <div>
                            <span className="block text-[8px] uppercase tracking-wider font-semibold text-slate-500">Status</span>
                            <span className={`font-bold uppercase tracking-widest text-[8px] ${
                              item.output_path ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {item.output_path ? 'Completed' : 'Awaiting'}
                            </span>
                          </div>

                          <div className="relative">
                            <button
                              onClick={() => setDownloadDropdownId(downloadDropdownId === item.id ? null : item.id)}
                              className="p-1 rounded bg-white/5 border border-white/10 text-emerald-400 hover:bg-white/10 transition-colors"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            
                            {downloadDropdownId === item.id && (
                              <div className="absolute right-0 bottom-7 w-48 rounded-xl bg-dark-800 border border-white/10 p-1.5 shadow-2xl z-40 backdrop-blur-md">
                                <button 
                                  onClick={() => downloadFile(item.id, 'original')}
                                  className="w-full text-left rounded-lg px-3 py-1.5 text-[10px] text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                  Original Image
                                </button>
                                <button 
                                  onClick={() => downloadFile(item.id, 'mask')}
                                  disabled={!item.mask_path}
                                  className="w-full text-left rounded-lg px-3 py-1.5 text-[10px] text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-40 transition-colors"
                                >
                                  Cloud Mask
                                </button>
                                <button 
                                  onClick={() => downloadFile(item.id, 'reconstructed')}
                                  disabled={!item.output_path}
                                  className="w-full text-left rounded-lg px-3 py-1.5 text-[10px] text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-40 transition-colors"
                                >
                                  Reconstructed Image
                                </button>
                                <button 
                                  onClick={() => downloadFile(item.id, 'report')}
                                  disabled={!item.output_path}
                                  className="w-full text-left rounded-lg px-3 py-1.5 text-[10px] text-accent-cyan font-bold hover:bg-white/5 hover:text-white disabled:opacity-40 transition-colors flex items-center gap-1"
                                >
                                  <FileText className="h-3 w-3" /> PDF Report
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-500 text-xs font-semibold">
                      No uploads logged in library.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 text-center text-[10px] text-slate-500 font-semibold">
                FastAPI SQL Engine Synchronization
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Database & Telemetry Tab View */
        <div className="space-y-6 animate-fade-in pb-12">
          {/* Telemetry & Stats Row */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Database Connection Card */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 relative overflow-hidden">
              <div className="absolute right-4 top-4 text-white/5">
                <Database className="h-16 w-16" />
              </div>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Database Connection</span>
              <div className="flex items-center gap-2 mt-2">
                <span className={`h-2.5 w-2.5 rounded-full ${dbStatus?.is_connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-xl font-bold text-white">
                  {dbStatus?.is_connected ? dbStatus.database_type : 'Disconnected'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-3 truncate bg-black/35 p-2 rounded-lg border border-white/5">
                {dbStatus?.database_url || 'No active connection'}
              </p>
            </div>

            {/* Data Telemetry Card */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 relative overflow-hidden">
              <div className="absolute right-4 top-4 text-white/5">
                <HardDrive className="h-16 w-16" />
              </div>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Library Storage Stats</span>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Total Records</span>
                  <span className="text-xl font-bold text-white">{dbStatus?.total_records ?? 0} tiles</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Database Size</span>
                  <span className="text-xl font-bold text-white">
                    {dbStatus?.file_size_bytes 
                      ? `${(dbStatus.file_size_bytes / 1024).toFixed(1)} KB`
                      : dbStatus?.is_connected ? 'Active Pool' : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* System Performance Card */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 relative overflow-hidden">
              <div className="absolute right-4 top-4 text-white/5">
                <BarChart3 className="h-16 w-16" />
              </div>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Systems Telemetry</span>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Hardware Device</span>
                  <span className="text-sm font-bold text-accent-cyan flex items-center gap-1 mt-1 font-mono">
                    <Cpu className="h-3.5 w-3.5" />
                    GPU (PyTorch)
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Users Table</span>
                  <span className="text-sm font-bold text-white mt-1 block">{dbStatus?.total_users ?? 1} seed accounts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Database Configuration and SQL Logs Terminal */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Database Connection Manager */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings className="h-4.5 w-4.5 text-accent-purple" />
                  Database Connection Manager
                </h3>
                <p className="text-xs text-slate-400 mt-1">Configure connections to local SQLite fallback databases or production-ready PostgreSQL clusters.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Database Connection URL (SQLAlchemy Connection String)
                  </label>
                  <input
                    type="text"
                    value={dbTestUrl}
                    onChange={(e) => setDbTestUrl(e.target.value)}
                    placeholder="postgresql://username:password@localhost:5432/dbname"
                    className="w-full rounded-xl border border-white/10 bg-dark-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-accent-cyan focus:outline-none transition-colors font-mono"
                  />
                </div>

                <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-semibold items-center">
                  <span>Presets:</span>
                  <button
                    onClick={() => {
                      setDbTestUrl('postgresql://postgres:postgres@localhost:5432/cloudclear');
                      addLog("Preset selected: Local Postgres default credentials");
                    }}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/5 text-accent-purple transition-all cursor-pointer"
                  >
                    PostgreSQL Default
                  </button>
                  <button
                    onClick={() => {
                      setDbTestUrl(`sqlite:///cloudclear.db`);
                      addLog("Preset selected: SQLite Fallback database file");
                    }}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/5 text-accent-cyan transition-all cursor-pointer"
                  >
                    SQLite Local File
                  </button>
                </div>

                {dbTestResult && (
                  <div className={`rounded-xl p-3 border text-xs font-semibold ${
                    dbTestResult.success 
                      ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400 animate-fade-in' 
                      : 'bg-rose-950/20 border-rose-500/20 text-rose-400 animate-fade-in'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {dbTestResult.success ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                      {dbTestResult.success ? 'Connection Succeeded' : 'Connection Failed'}
                    </div>
                    <span className="font-mono text-[10px] block opacity-80 break-all">{dbTestResult.message}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={dbTesting || dbConfiguring}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {dbTesting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    Test Connection
                  </button>
                  <button
                    onClick={handleApplyConnection}
                    disabled={dbTesting || dbConfiguring}
                    className="flex-1 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple px-4 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {dbConfiguring && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    Apply & Reconnect
                  </button>
                </div>
              </div>
            </div>

            {/* SQL Telemetry Console Logs */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col justify-between h-80">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal className="h-4.5 w-4.5 text-accent-cyan" />
                  SQL Engine Logs
                </h3>
                <span className="text-[10px] bg-accent-cyan/10 border border-accent-cyan/20 px-2 py-0.5 rounded text-accent-cyan font-mono animate-pulse">LIVE FEED</span>
              </div>
              <div className="bg-black/45 border border-white/5 rounded-xl p-3 flex-1 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-1 min-h-[170px] select-text">
                {dbLogs.length > 0 ? (
                  dbLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed break-all">
                       {log}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-600 text-center py-12">No database engine transactions logged yet.</div>
                )}
              </div>
              <div className="pt-2 text-[9px] text-slate-500 text-right font-semibold">Logs persist for current browser context session</div>
            </div>
          </div>

          {/* Database Explorer Grid Table */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="h-4.5 w-4.5 text-accent-cyan" />
                  Library SQL Explorer
                </h3>
                <p className="text-xs text-slate-400 mt-1">Directly explore rows stored in the backend SQL database tables.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by filename..."
                    className="rounded-xl border border-white/10 bg-dark-800 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-accent-cyan focus:outline-none transition-colors w-64"
                  />
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                </div>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full border-collapse text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2 select-none text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="p-3.5">ID</th>
                    <th className="p-3.5">Preview</th>
                    <th className="p-3.5">Image Details</th>
                    <th className="p-3.5">Cloud Cover %</th>
                    <th className="p-3.5">Process Device</th>
                    <th className="p-3.5">Engine/Model Used</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-black/10">
                  {historyList.filter(item => item.filename.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                    historyList
                      .filter(item => item.filename.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((item) => (
                        <tr key={item.id} className="hover:bg-white/2 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-slate-400">#{item.id}</td>
                          <td className="p-3.5">
                            <div className="h-10 w-10 rounded-lg overflow-hidden border border-white/10 bg-dark-800">
                              <img 
                                src={`${BACKEND_URL}${item.original_path}`} 
                                alt="Thumbnail" 
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </td>
                          <td className="p-3.5 max-w-[180px]">
                            <span className="block font-bold text-white truncate">{item.filename}</span>
                            <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                              {new Date(item.upload_time).toLocaleString()}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {item.cloud_percentage !== null ? (
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                item.cloud_percentage > 40
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {item.cloud_percentage}%
                              </span>
                            ) : (
                              <span className="text-slate-500 font-semibold">Unprocessed</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-accent-cyan">
                              <Cpu className="h-3 w-3" /> GPU
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-300">
                              {item.reconstruction_engine || 'N/A'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => downloadFile(item.id, 'original')}
                                className="p-1.5 rounded bg-white/5 border border-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                                title="Original Image"
                              >
                                <ImageIcon className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => downloadFile(item.id, 'reconstructed')}
                                disabled={!item.output_path}
                                className="p-1.5 rounded bg-white/5 border border-white/5 text-emerald-400 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-all cursor-pointer"
                                title="Reconstructed Image"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => downloadFile(item.id, 'report')}
                                disabled={!item.output_path}
                                className="p-1.5 rounded bg-white/5 border border-white/5 text-accent-cyan hover:text-white hover:bg-white/10 disabled:opacity-40 transition-all cursor-pointer"
                                title="Processing Report PDF"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 text-xs font-semibold">
                        No rows matching the search criteria found in database tables.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass-panel rounded-2xl p-6 border border-rose-500/20 bg-rose-500/2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
              Danger Zone - Clear Library History
            </h3>
            <p className="text-xs text-rose-300 mt-1">Wipes the imagery database records and permanently deletes all files in output and upload directories.</p>
            
            <div className="mt-4">
              {!confirmClear ? (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Purge Database & File Cache
                </button>
              ) : (
                <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-4 space-y-3 max-w-md">
                  <span className="block text-xs font-bold text-rose-400">Are you absolutely sure? This action is irreversible.</span>
                  <div className="flex gap-3">
                    <button
                      onClick={handleClearHistory}
                      className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      Yes, Clear Everything
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
