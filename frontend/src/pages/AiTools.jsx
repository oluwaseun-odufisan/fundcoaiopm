// src/pages/AiTools.jsx (Modern redesign: Sleek UI with dark mode toggle, responsive, better layout, fixed errors, improved history with proper titles)
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Brain, ArrowLeft, FileText, Zap, List, Clock, Mail, FileSearch,
  Lightbulb, BarChart, Search, RotateCcw, X, ChevronRight, Mic,
  Calendar, AlertCircle, TrendingUp, Users, FileText as Document, Cpu,
  History, Globe, DollarSign, Home, Leaf, BatteryCharging, Shield,
  Sprout, Globe2, Calculator, FileCheck, LeafyGreen, PlugZap, BarChart3,
  ShieldCheck, TrendingUp as Forecast, Cpu as Automate, Search as Research,
  Bell, Target, Users as Team, FileText as Doc, Cpu as AutoBuild, Calendar as CalOpt,
  Moon, Sun, Loader2, Copy, Download, Send, RefreshCw, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// Professional Palette with dark mode
const LIGHT_THEME = {
  primary: '#1E40AF',
  secondary: '#16A34A',
  accent: '#F59E0B',
  danger: '#DC2626',
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    500: '#6B7280',
    700: '#374151',
    900: '#111827',
    border: '#E5E7EB'
  },
  bg: 'bg-gray-50',
  cardBg: 'bg-white',
  text: 'text-gray-900',
  subText: 'text-gray-500'
};
const DARK_THEME = {
  primary: '#60A5FA',
  secondary: '#4ADE80',
  accent: '#FBBF24',
  danger: '#EF4444',
  neutral: {
    50: '#111827',
    100: '#1F2937',
    200: '#374151',
    300: '#4B5563',
    500: '#9CA3AF',
    700: '#D1D5DB',
    900: '#F3F4F6',
    border: '#374151'
  },
  bg: 'bg-gray-900',
  cardBg: 'bg-gray-800',
  text: 'text-gray-100',
  subText: 'text-gray-400'
};
// Categories based on FundCo AssetCos
const CATEGORIES = [
  { id: 'general', name: 'General Tools', icon: Brain, description: 'Core task management and AI utilities.' },
  { id: 'clean-energy', name: 'Clean Energy (CEF/EML/GroSolar)', icon: Zap, description: 'Tools for mini-grids, solar, PuE.' },
  { id: 'housing', name: 'Housing (HSF)', icon: Home, description: 'Mortgage, valuation, green building tools.' },
  { id: 'agriculture', name: 'Agriculture (Agronomie)', icon: Leaf, description: 'Crop, PuE, agro-processing tools.' },
  { id: 'e-mobility', name: 'E-Mobility (SSM)', icon: BatteryCharging, description: 'EV, battery swap optimization.' },
  { id: 'finance-esg', name: 'Finance & ESG', icon: DollarSign, description: 'Portfolio, risk, compliance tools.' }
];
// Expanded AI Tools (50 total)
const AI_TOOLS = {
  general: [
    { id: 'general-ai', name: 'General FundCo AI', icon: Brain, description: 'Ask anything FundCo-related.' },
    { id: 'report-generator', name: 'Report Generator', icon: FileText, description: 'Generate progress reports with insights.' , hasSpecialInput: true },
    { id: 'task-prioritizer', name: 'Task Prioritizer', icon: List, description: 'Prioritize tasks using frameworks.' , hasSpecialInput: true },
    { id: 'effort-estimator', name: 'Effort Estimator', icon: Clock, description: 'Estimate time/resources.' , hasSpecialInput: true },
    { id: 'task-breaker', name: 'Task Breaker', icon: Zap, description: 'Decompose tasks.' },
    { id: 'email-writer', name: 'Email Writer', icon: Mail, description: 'Draft professional emails.' },
    { id: 'summary-generator', name: 'Summary Generator', icon: FileSearch, description: 'Summarize content.' },
    { id: 'brainstormer', name: 'Idea Brainstormer', icon: Lightbulb, description: 'Generate ideas.' },
    { id: 'performance-analyzer', name: 'Performance Analyzer', icon: BarChart, description: 'Analyze metrics.' },
    { id: 'research-assistant', name: 'Research Assistant', icon: Search, description: 'Research topics.' },
    { id: 'reminder-optimizer', name: 'Reminder Optimizer', icon: AlertCircle, description: 'Suggest reminders.' },
    { id: 'goal-planner', name: 'Goal Planner', icon: TrendingUp, description: 'Create SMART goals.' },
    { id: 'team-collaborator', name: 'Team Collaborator', icon: Users, description: 'Suggest assignments.' },
    { id: 'document-analyzer', name: 'Document Analyzer', icon: Document, description: 'Analyze files.' },
    { id: 'automation-builder', name: 'Automation Builder', icon: Cpu, description: 'Design workflows.' },
    { id: 'calendar-optimizer', name: 'Calendar Optimizer', icon: Calendar, description: 'Optimize schedules.' },
    { id: 'ai-orchestrator', name: 'AI Orchestrator', icon: Globe, description: 'Route queries to tools, chain actions.' },
    { id: 'knowledge-base-query', name: 'Knowledge Base Query', icon: Search, description: 'Query FundCo docs/SOPs.' },
    { id: 'term-definer', name: 'Term Definer', icon: FileText, description: 'Define FundCo terms.' },
    { id: 'sop-query', name: 'SOP Query', icon: FileCheck, description: 'Query specific SOPs.' },
    { id: 'unit-responsibility-query', name: 'Unit Responsibility Query', icon: Users, description: 'Query unit responsibilities.' },
    { id: 'team-profile-query', name: 'Team Profile Query', icon: Users, description: 'Query team profiles.' },
    { id: 'learning-resource-recommender', name: 'Learning Recommender', icon: Globe2, description: 'Recommend training resources.' }
  ],
  'clean-energy': [
    { id: 'mini-grid-planner', name: 'Mini-Grid Planner', icon: Zap, description: 'Plan mini-grids with PuE.' },
    { id: 'lcoe-calculator', name: 'LCOE Calculator', icon: Calculator, description: 'Calculate levelized cost.' },
    { id: 'ppa-drafter', name: 'PPA Drafter', icon: FileText, description: 'Draft Power Purchase Agreements.' },
    { id: 'carbon-credit-estimator', name: 'Carbon Credit Estimator', icon: LeafyGreen, description: 'Estimate credits.' },
    { id: 'site-surveyor', name: 'Site Surveyor', icon: Search, description: 'Simulate site surveys.' },
    { id: 'installation-simulator', name: 'Installation Simulator', icon: PlugZap, description: 'Simulate installations.' },
    { id: 'o-m-planner', name: 'O&M Planner', icon: RotateCcw, description: 'Plan operations & maintenance.' },
    { id: 'green-kiosk-planner', name: 'Green Kiosk Planner', icon: Sprout, description: 'Plan rural kiosks.' }
  ],
  housing: [
    { id: 'mortgage-simulator', name: 'Mortgage Simulator', icon: Home, description: 'Simulate HSF mortgages.' },
    { id: 'property-valuator', name: 'Property Valuator', icon: DollarSign, description: 'Valuate properties.' },
    { id: 'green-building-assessor', name: 'Green Building Assessor', icon: Shield, description: 'Assess sustainability.' },
    { id: 'boq-generator', name: 'BoQ Generator', icon: FileText, description: 'Generate Bill of Quantities.' }
  ],
  agriculture: [
    { id: 'crop-yield-predictor', name: 'Crop Yield Predictor', icon: Leaf, description: 'Predict yields with energy.' },
    { id: 'pue-optimizer', name: 'PuE Optimizer', icon: Cpu, description: 'Optimize agro PuE.' },
    { id: 'agro-processing-simulator', name: 'Agro-Processing Simulator', icon: Zap, description: 'Simulate processing.' },
    { id: 'bsf-farming-simulator', name: 'BSF Farming Simulator', icon: LeafyGreen, description: 'Simulate Black Soldier Fly farming.' },
    { id: 'waste-management-optimizer', name: 'Waste Management Optimizer', icon: RotateCcw, description: 'Optimize waste for BSF.' },
    { id: 'needs-assessment-tool', name: 'Needs Assessment Tool', icon: Search, description: 'Conduct virtual assessments.' }
  ],
  'e-mobility': [
    { id: 'ev-infrastructure-planner', name: 'EV Infrastructure Planner', icon: BatteryCharging, description: 'Plan stations.' },
    { id: 'battery-swap-optimizer', name: 'Battery Swap Optimizer', icon: RotateCcw, description: 'Optimize swaps.' },
    { id: 'ev-swap-sop-simulator', name: 'EV Swap SOP Simulator', icon: FileCheck, description: 'Simulate SSM SOPs.' }
  ],
  'finance-esg': [
    { id: 'portfolio-risk-analyzer', name: 'Portfolio Risk Analyzer', icon: BarChart, description: 'Analyze risks.' },
    { id: 'esg-compliance-checker', name: 'ESG Compliance Checker', icon: ShieldCheck, description: 'Check compliance.' },
    { id: 'investment-forecaster', name: 'Investment Forecaster', icon: Forecast, description: 'Forecast ROI.' },
    { id: 'financial-structurer', name: 'Financial Structurer', icon: DollarSign, description: 'Structure financing.' },
    { id: 'risk-mitigator', name: 'Risk Mitigator', icon: AlertCircle, description: 'Mitigate project risks.' },
    { id: 'impact-measurer', name: 'Impact Measurer', icon: Globe, description: 'Measure SDG impact.' },
    { id: 'grant-applier', name: 'Grant Applier', icon: FileText, description: 'Draft grant applications.' },
    { id: 'partner-matcher', name: 'Partner Matcher', icon: Users, description: 'Match OEMs/partners.' },
    { id: 'kyc-assessor', name: 'KYC Assessor', icon: Shield, description: 'Simulate KYC.' },
    { id: 'credit-evaluator', name: 'Credit Evaluator', icon: BarChart3, description: 'Evaluate credit.' },
    { id: 'financial-proposal-drafter', name: 'Financial Proposal Drafter', icon: FileText, description: 'Draft proposals.' },
    { id: 'contract-drafter', name: 'Contract Drafter', icon: FileCheck, description: 'Draft contracts.' },
    { id: 'portfolio-monitor', name: 'Portfolio Monitor', icon: BarChart, description: 'Monitor portfolios.' },
    { id: 'sdg-impact-analyzer', name: 'SDG Impact Analyzer', icon: Globe2, description: 'Analyze SDG alignment.' },
    { id: 'climate-risk-assessor', name: 'Climate Risk Assessor', icon: AlertCircle, description: 'Assess climate risks.' },
    { id: 'procurement-advisor', name: 'Procurement Advisor', icon: Automate, description: 'Advise on procurement.' },
    { id: 'community-engager', name: 'Community Engager', icon: Users, description: 'Generate engagement plans.' },
    { id: 'sustainability-reporter', name: 'Sustainability Reporter', icon: FileText, description: 'Generate reports.' },
    { id: 'training-simulator', name: 'Training Simulator', icon: Research, description: 'Simulate training.' },
    { id: 'oem-selector', name: 'OEM Selector', icon: Search, description: 'Select OEMs.' }
  ]
};
// Report templates
const REPORT_TEMPLATES = {
  daily: { title: "Daily Progress Report", greeting: "Good morning team;", summary: "Here's today's update.", completed: "Completed Today", pending: "In Progress", next: "Tomorrow's Focus", closing: "Let's keep the momentum." },
  weekly: { title: "Weekly Progress Report", greeting: "Hello team;", summary: "This week in review.", completed: "Completed This Week", pending: "Ongoing Work", next: "Next Week Priorities", closing: "Strong progress ahead." },
  monthly: { title: "Monthly Progress Report", greeting: "Team;", summary: "This month's achievements.", completed: "Completed This Month", pending: "In Progress", next: "Next Month Focus", closing: "On track and aligned." }
};
const AiTools = () => {
  const { user, tasks = [] } = useOutletContext();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [selectedTool, setSelectedTool] = useState(AI_TOOLS.general[0].id);
  const [chatHistories, setChatHistories] = useState({}); // Current session chats per tool
  const [pastHistories, setPastHistories] = useState({}); // Loaded from backend per tool
  const [globalHistories, setGlobalHistories] = useState([]); // All histories for search
  const [searchQuery, setSearchQuery] = useState('');
  const [inputs, setInputs] = useState({});
  const [isResponding, setIsResponding] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [openHistories, setOpenHistories] = useState(new Set());
  const [reportType, setReportType] = useState('daily');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [reportContent, setReportContent] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportAudience, setReportAudience] = useState('personal');
  const [prioritizeOutput, setPrioritizeOutput] = useState('');
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [effortTask, setEffortTask] = useState('');
  const [estimateOutput, setEstimateOutput] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [aiInsights, setAiInsights] = useState([]);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'history'
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'
  const currentTheme = theme === 'light' ? LIGHT_THEME : DARK_THEME;
  const recognitionRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [activeListeningTool, setActiveListeningTool] = useState(null);
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputs(prev => ({...prev, [activeListeningTool]: (prev[activeListeningTool] || '') + ' ' + transcript}));
        toast.success('Voice input added!');
      };
      recognitionRef.current.onerror = (event) => {
        toast.error('Voice recognition error: ' + event.error);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    } else {
      toast.error('Voice recognition not supported in this browser.');
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);
  const toggleVoice = (toolId) => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setActiveListeningTool(toolId);
      recognitionRef.current.start();
      setIsListening(true);
      toast('Listening... Speak now!');
    }
  };
  const getTaskContext = () => {
    return tasks.map(t => ({
      title: t.title,
      completed: t.completed,
      dueDate: t.dueDate ? format(new Date(t.dueDate), 'MMM d, yyyy') : null,
      priority: t.priority || 'Medium'
    }));
  };
  const callGrok = async (messages, toolId, onStream = (content) => {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first');
      return;
    }
    setIsResponding(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/grok/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages,
          taskContext: JSON.stringify(getTaskContext()),
          toolId
        })
      });
      if (!response.ok) throw new Error('API error');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                onStream(parsed.content);
              }
              if (parsed.error) throw new Error(parsed.error);
            } catch {}
          }
        }
      }
      toast.success('FundCo AI responded!');
      return fullContent; // Return for title generation
    } catch (err) {
      toast.error(err.message || 'Failed to get response');
    } finally {
      setIsResponding(false);
    }
  };
  const fetchHistory = async (toolId = null) => {
    const token = localStorage.getItem('token');
    if (!token) return toast.error('Please login first');
    setLoadingHistory(true);
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/grok/chat-history${toolId ? `?toolId=${toolId}` : ''}`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('API error');
      const { histories } = await response.json();
      if (toolId) {
        setPastHistories(prev => ({ ...prev, [toolId]: histories }));
      } else {
        setGlobalHistories(histories);
      }
      toast.success('History loaded!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingHistory(false);
    }
  };
  useEffect(() => {
    fetchHistory(); // Load global on mount
  }, []);
  const handleSend = (toolId) => async () => {
    const input = inputs[toolId] || '';
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setChatHistories(prev => ({...prev, [toolId]: [...(prev[toolId] || []), userMessage]}));
    setInputs(prev => ({...prev, [toolId]: ''}));
    const tempId = Date.now();
    setChatHistories(prev => ({...prev, [toolId]: [...(prev[toolId] || []), { role: 'assistant', content: '', id: tempId }]}));
    const fullMessages = (chatHistories[toolId] || []).concat(userMessage);
    const fullContent = await callGrok(fullMessages, toolId, (content) => {
      setChatHistories(prev => {
        const hist = prev[toolId] || [];
        const last = hist[hist.length - 1];
        if (last.id === tempId) {
          last.content += content;
        }
        return {...prev, [toolId]: [...hist]};
      });
    });
    fetchHistory(toolId); // Refresh history after new message
  };
  const handleKeyDown = (toolId) => (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(toolId)();
    }
  };
  const clearChat = (toolId) => () => {
    setChatHistories(prev => ({...prev, [toolId]: []}));
    toast.success('Chat cleared');
  };
  const handleCopy = async (content) => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };
  const downloadContent = (content, filename) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded!');
  };
  const filteredTasks = useMemo(() => {
    let start, end;
    const today = new Date();
    if (reportType === 'daily') {
      start = startOfDay(today);
      end = endOfDay(today);
    } else if (reportType === 'weekly') {
      start = startOfWeek(today, { weekStartsOn: 1 });
      end = endOfDay(today);
    } else if (reportType === 'monthly') {
      start = startOfMonth(today);
      end = endOfDay(today);
    } else if (reportType === 'custom' && customStartDate && customEndDate) {
      start = startOfDay(new Date(customStartDate));
      end = endOfDay(new Date(customEndDate));
    } else {
      return [];
    }
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      return isWithinInterval(due, { start, end });
    });
  }, [tasks, reportType, customStartDate, customEndDate]);
  useEffect(() => {
    if (reportType !== 'custom') {
      const newSet = new Set(filteredTasks.map(t => t._id || t.id));
      setSelectedTaskIds(newSet);
    }
  }, [filteredTasks, reportType]);
  const selectAll = () => {
    const newSet = new Set(filteredTasks.map(t => t._id || t.id));
    setSelectedTaskIds(newSet);
  };
  const clearSelection = () => setSelectedTaskIds(new Set());
  const toggleTask = (id) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setReportContent('');
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first');
      setIsGeneratingReport(false);
      return;
    }
    const selectedTasks = filteredTasks.filter(t => selectedTaskIds.has(t._id || t.id));
    if (selectedTasks.length === 0) {
      setReportContent('**No Tasks Found**\n\nThere are no tasks for the selected period. No report can be generated.');
      setIsGeneratingReport(false);
      return;
    }
    const taskContext = JSON.stringify(selectedTasks);
    const template = REPORT_TEMPLATES[reportType] || REPORT_TEMPLATES.daily;
    const audiencePrompt = reportAudience === 'personal' ? 'Generate for personal use, address as "you", offer help for undone tasks.' : 'Generate for submission to superior, keep formal.';
    const messages = [
      { role: 'user', content: `Generate a ${reportType} report using this template: Title: ${template.title}, Greeting: ${template.greeting}, Summary: ${template.summary}, Completed: ${template.completed}, Pending: ${template.pending}, Next: ${template.next}, Closing: ${template.closing}. ${audiencePrompt}. If no tasks, state that clearly.` }
    ];
    await callGrok(messages, 'report-generator', (content) => setReportContent(prev => prev + content));
    setIsGeneratingReport(false);
    // Mock insights with improvements
    setAiInsights([
      { text: 'High completion rate this week. Consider automating repetitive tasks.', level: 'success' },
      { text: 'Watch for overdue tasks. FundCo AI can help with reminders.', level: 'warn' },
      { text: 'Productivity trend upward. Great job!', level: 'info' }
    ]);
  };
  const downloadReport = () => {
    downloadContent(reportContent, `${reportType}_report.md`);
  };
  const handleSubmit = () => {
    toast.success('Report submitted!');
  };
  const handlePrioritizeAll = async () => {
    setIsPrioritizing(true);
    setPrioritizeOutput('');
    const messages = [{ role: 'user', content: 'Analyze and prioritize all my tasks based on the provided context. Offer help for low-priority or undone tasks.' }];
    await callGrok(messages, 'task-prioritizer', (content) => setPrioritizeOutput(prev => prev + content));
    setIsPrioritizing(false);
  };
  const handleEstimateGrok = async () => {
    if (!effortTask.trim()) return;
    setIsEstimating(true);
    setEstimateOutput('');
    const messages = [{ role: 'user', content: `Estimate effort for this task: ${effortTask}. Provide tips to optimize based on context.` }];
    await callGrok(messages, 'effort-estimator', (content) => setEstimateOutput(prev => prev + content));
    setIsEstimating(false);
  };
  const resumeChat = (hist) => {
    setChatHistories(prev => ({ ...prev, [hist.toolId]: hist.messages }));
    setSelectedTool(hist.toolId);
    setSelectedCategory(CATEGORIES.find(cat => AI_TOOLS[cat.id].some(t => t.id === hist.toolId)).id);
    setActiveTab('chat');
    toast.success('Chat resumed!');
  };
  const filteredHistories = useMemo(() => {
    return globalHistories.filter(h =>
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.summary.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [globalHistories, searchQuery]);
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  return (
    <>
      <Toaster position="top-center" toastOptions={{ style: { background: currentTheme.primary, color: 'white', fontWeight: '600' } }} />
      <div className={`min-h-screen ${currentTheme.bg} dark:${DARK_THEME.bg} flex`}>
        {/* Sidebar: Categories */}
        <div className={`w-64 ${currentTheme.cardBg} dark:${DARK_THEME.cardBg} border-r ${currentTheme.neutral.border} dark:${DARK_THEME.neutral.border} p-4 space-y-4`}>
          <h2 className={`text-xl font-bold ${currentTheme.text} dark:${DARK_THEME.text}`}>FundCo AI Categories</h2>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setSelectedTool(AI_TOOLS[cat.id][0].id); fetchHistory(AI_TOOLS[cat.id][0].id); }}
              className={`w-full p-3 flex items-center gap-3 text-left rounded-lg ${selectedCategory === cat.id ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <cat.icon className="w-5 h-5 text-current" />
              <div>
                <p className="font-medium">{cat.name}</p>
                <p className="text-xs text-current opacity-70">{cat.description}</p>
              </div>
            </button>
          ))}
        </div>
        {/* Main Content */}
        <div className="flex-1 p-6">
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className={`text-2xl font-bold ${currentTheme.text} dark:${DARK_THEME.text}`}>FundCo AI Hub</h1>
                <p className={`text-sm ${currentTheme.subText} dark:${DARK_THEME.subText}`}>Sector-specific AI for all AssetCos • Powered by xAI</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg">
                <ArrowLeft className="w-5 h-5" /> Dashboard
              </button>
            </div>
          </header>
          <div className="flex gap-4">
            {/* Tool Selector */}
            <div className="w-72 space-y-4">
              <h3 className={`text-lg font-semibold ${currentTheme.text} dark:${DARK_THEME.text}`}>Tools in {CATEGORIES.find(c => c.id === selectedCategory).name}</h3>
              <div className="space-y-2">
                {AI_TOOLS[selectedCategory].map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => { setSelectedTool(tool.id); fetchHistory(tool.id); }}
                    className={`w-full p-4 flex items-center gap-3 text-left rounded-lg border ${selectedTool === tool.id ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'}`}
                  >
                    <tool.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className={`font-medium ${currentTheme.text} dark:${DARK_THEME.text}`}>{tool.name}</p>
                      <p className={`text-xs ${currentTheme.subText} dark:${DARK_THEME.subText}`}>{tool.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {/* Chat/History Panel */}
            <div className={`flex-1 ${currentTheme.cardBg} dark:${DARK_THEME.cardBg} rounded-xl border ${currentTheme.neutral.border} dark:${DARK_THEME.neutral.border} p-6 space-y-4 shadow-lg`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-bold ${currentTheme.text} dark:${DARK_THEME.text}`}>{AI_TOOLS[selectedCategory].find(t => t.id === selectedTool).name}</h3>
                <div className="flex gap-2">
                  <button onClick={() => setActiveTab('chat')} className={`px-4 py-2 rounded-lg ${activeTab === 'chat' ? 'bg-blue-600 dark:bg-blue-700 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Chat</button>
                  <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-lg ${activeTab === 'history' ? 'bg-blue-600 dark:bg-blue-700 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>History</button>
                  <input
                    type="text"
                    placeholder="Search histories..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={`px-3 py-2 border ${currentTheme.neutral.border} dark:${DARK_THEME.neutral.border} rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-transparent ${currentTheme.text} dark:${DARK_THEME.text}`}
                  />
                </div>
              </div>
              {activeTab === 'chat' ? (
                <div className="space-y-4">
                  {AI_TOOLS[selectedCategory].find(t => t.id === selectedTool).hasSpecialInput && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      {selectedTool === 'report-generator' && (
                        <div className="space-y-4">
                          <h4 className={`text-lg font-semibold ${currentTheme.text} dark:${DARK_THEME.text} flex items-center gap-3`}>
                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            Generate Report
                          </h4>
                          <select value={reportType} onChange={e => setReportType(e.target.value)} className={`p-2 border rounded-lg w-full ${currentTheme.text} dark:${DARK_THEME.text}`}>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="custom">Custom</option>
                          </select>
                          {reportType === 'custom' && (
                            <div className="flex gap-2">
                              <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className={`p-2 border rounded-lg flex-1 ${currentTheme.text} dark:${DARK_THEME.text}`} />
                              <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className={`p-2 border rounded-lg flex-1 ${currentTheme.text} dark:${DARK_THEME.text}`} />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={selectAll} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-sm">Select All</button>
                            <button onClick={clearSelection} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-lg text-sm">Clear</button>
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-2">
                            {filteredTasks.map(task => (
                              <label key={task._id} className="flex items-center gap-2">
                                <input type="checkbox" checked={selectedTaskIds.has(task._id)} onChange={() => toggleTask(task._id)} className="accent-blue-600 dark:accent-blue-400" />
                                {task.title}
                              </label>
                            ))}
                          </div>
                          <select value={reportAudience} onChange={e => setReportAudience(e.target.value)} className={`p-2 border rounded-lg w-full ${currentTheme.text} dark:${DARK_THEME.text}`}>
                            <option value="personal">Personal Review</option>
                            <option value="superior">Submit to Superior</option>
                          </select>
                          <button onClick={handleGenerateReport} disabled={isGeneratingReport} className="w-full p-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2">
                            {isGeneratingReport ? <Loader2 className="animate-spin" /> : <Send />} Generate
                          </button>
                          {reportContent && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg relative">
                              <ReactMarkdown>{reportContent}</ReactMarkdown>
                              <div className="absolute top-2 right-2 flex gap-2">
                                <button onClick={() => handleCopy(reportContent)}>{copied ? <Check /> : <Copy />}</button>
                                <button onClick={downloadReport}><Download /></button>
                              </div>
                            </div>
                          )}
                          {aiInsights.map((insight, i) => (
                            <div key={i} className={`p-3 rounded-lg ${insight.level === 'success' ? 'bg-green-50 dark:bg-green-900/30' : insight.level === 'warn' ? 'bg-yellow-50 dark:bg-yellow-900/30' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                              {insight.text}
                            </div>
                          ))}
                          <button onClick={handleSubmit} className="w-full p-2 bg-green-600 dark:bg-green-700 text-white rounded-lg">Submit Report</button>
                        </div>
                      )}
                      {selectedTool === 'task-prioritizer' && (
                        <div className="space-y-4">
                          <h4 className={`text-lg font-semibold ${currentTheme.text} dark:${DARK_THEME.text} flex items-center gap-3`}>
                            <List className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            Prioritize Tasks
                          </h4>
                          <button onClick={handlePrioritizeAll} disabled={isPrioritizing} className="w-full p-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2">
                            {isPrioritizing ? <Loader2 className="animate-spin" /> : <RefreshCw />} Prioritize All Tasks
                          </button>
                          {prioritizeOutput && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg relative">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{prioritizeOutput}</ReactMarkdown>
                              <div className="absolute top-2 right-2 flex gap-2">
                                <button onClick={() => handleCopy(prioritizeOutput)}>{copied ? <Check /> : <Copy />}</button>
                                <button onClick={() => downloadContent(prioritizeOutput, 'prioritized_tasks.md')}><Download /></button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {selectedTool === 'effort-estimator' && (
                        <div className="space-y-4">
                          <h4 className={`text-lg font-semibold ${currentTheme.text} dark:${DARK_THEME.text} flex items-center gap-3`}>
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            Estimate Effort
                          </h4>
                          <input
                            value={effortTask}
                            onChange={e => setEffortTask(e.target.value)}
                            placeholder="Describe the task..."
                            className={`p-2 border rounded-lg w-full ${currentTheme.text} dark:${DARK_THEME.text}`}
                          />
                          <button onClick={handleEstimateGrok} disabled={isEstimating} className="w-full p-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2">
                            {isEstimating ? <Loader2 className="animate-spin" /> : <Send />} Estimate
                          </button>
                          {estimateOutput && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg relative">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{estimateOutput}</ReactMarkdown>
                              <div className="absolute top-2 right-2 flex gap-2">
                                <button onClick={() => handleCopy(estimateOutput)}>{copied ? <Check /> : <Copy />}</button>
                                <button onClick={() => downloadContent(estimateOutput, 'effort_estimate.md')}><Download /></button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                  <div className="max-h-96 overflow-y-auto space-y-4 scrollbar-thin">
                    <AnimatePresence>
                      {(chatHistories[selectedTool] || []).map((msg, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-lg ${msg.role === 'user' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100' : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={inputs[selectedTool] || ''}
                      onChange={e => setInputs(prev => ({ ...prev, [selectedTool]: e.target.value }))}
                      onKeyDown={handleKeyDown(selectedTool)}
                      placeholder="Type your message..."
                      className={`flex-1 p-3 border ${currentTheme.neutral.border} dark:${DARK_THEME.neutral.border} rounded-lg resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-transparent ${currentTheme.text} dark:${DARK_THEME.text}`}
                      rows={3}
                    />
                    <button onClick={handleSend(selectedTool)} disabled={isResponding} className="p-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-60">
                      <Send className="w-5 h-5" />
                    </button>
                    <button onClick={() => toggleVoice(selectedTool)} className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                  <button onClick={clearChat(selectedTool)} className={`text-sm ${currentTheme.subText} dark:${DARK_THEME.subText} hover:text-gray-700 dark:hover:text-gray-300`}>Clear Chat</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {loadingHistory ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 dark:text-blue-400" /> : (
                    (pastHistories[selectedTool] || []).filter(h =>
                      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      h.summary.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(hist => {
                      const isOpen = openHistories.has(hist._id);
                      return (
                        <motion.div key={hist._id} className={`rounded-lg overflow-hidden shadow-md ${currentTheme.cardBg} dark:${DARK_THEME.cardBg}`}>
                          <button onClick={() => toggleHistory(hist._id)} className={`w-full p-3 flex items-center justify-between text-left hover:opacity-90 ${currentTheme.text} dark:${DARK_THEME.text}`}>
                            <div>
                              <p className="font-medium">{hist.title || 'Untitled Chat'}</p>
                              <p className="text-xs text-current opacity-70">{hist.summary} • {format(new Date(hist.createdAt), 'MMM d, yyyy HH:mm')}</p>
                            </div>
                            <ChevronRight className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <div className="p-4 space-y-4 max-h-60 overflow-y-auto">
                                  {hist.messages.map((msg, i) => (
                                    <div key={i} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-50 dark:bg-gray-700'}`}>
                                      <ReactMarkdown remarkPlugins={[remarkGfm]} className={currentTheme.text} dark={DARK_THEME.text}>{msg.content}</ReactMarkdown>
                                    </div>
                                  ))}
                                </div>
                                <div className="p-4 flex gap-2 border-t border-gray-200 dark:border-gray-600">
                                  <button onClick={() => resumeChat(hist)} className="px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white rounded-lg">Resume</button>
                                  <button onClick={async () => {
                                    await fetch(`${import.meta.env.VITE_API_URL}/api/grok/chat/${hist._id}/summarize`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
                                    fetchHistory(selectedTool);
                                  }} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">Resummarize</button>
                                  <button onClick={async () => {
                                    const newTitle = prompt('New title:', hist.title);
                                    const newTags = prompt('Tags (comma-separated):', hist.tags.join(','));
                                    if (newTitle || newTags) {
                                      await fetch(`${import.meta.env.VITE_API_URL}/api/grok/chat/${hist._id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                                        body: JSON.stringify({ title: newTitle, tags: newTags ? newTags.split(',') : hist.tags })
                                      });
                                      fetchHistory(selectedTool);
                                    }
                                  }} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">Edit</button>
                                  <button onClick={async () => {
                                    if (confirm('Delete?')) {
                                      await fetch(`${import.meta.env.VITE_API_URL}/api/grok/chat/${hist._id}`, {
                                        method: 'DELETE',
                                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                      });
                                      fetchHistory(selectedTool);
                                    }
                                  }} className="px-3 py-1 bg-red-600 dark:bg-red-700 text-white rounded-lg">Delete</button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .scrollbar-thin { scrollbar-width: thin; }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </>
  );
};
export default AiTools;