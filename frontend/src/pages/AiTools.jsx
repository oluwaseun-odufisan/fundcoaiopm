// src/pages/AiTools.jsx
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
    Moon, Sun, Loader2, Copy, Download, Send, RefreshCw, Check, Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import debounce from 'lodash/debounce';

const AiTools = () => {
    const { user, tasks = [] } = useOutletContext();
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('general');
    const [selectedTool, setSelectedTool] = useState('general-ai');
    const [chatHistories, setChatHistories] = useState({});
    const [pastHistories, setPastHistories] = useState({});
    const [globalHistories, setGlobalHistories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [inputs, setInputs] = useState({});
    const [selectedFiles, setSelectedFiles] = useState({});
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
    const [activeTab, setActiveTab] = useState('chat');
    const chatContainerRef = useRef(null);
    const [copied, setCopied] = useState(false);
    const [activeListeningTool, setActiveListeningTool] = useState(null);
    const recognitionRef = useRef(null);

    // CATEGORIES & TOOLS (logic preserved exactly)
    const CATEGORIES = [
        { id: 'general', name: 'General Tools', icon: Brain, description: 'Core task management and AI utilities.' },
        { id: 'clean-energy', name: 'Clean Energy (CEF/EML/GroSolar)', icon: Zap, description: 'Tools for mini-grids, solar, PuE.' },
        { id: 'housing', name: 'Housing (HSF)', icon: Home, description: 'Mortgage, valuation, green building tools.' },
        { id: 'agriculture', name: 'Agriculture (Agronomie)', icon: Leaf, description: 'Crop, PuE, agro-processing tools.' },
        { id: 'e-mobility', name: 'E-Mobility (SSM)', icon: BatteryCharging, description: 'EV, battery swap optimization.' },
        { id: 'finance-esg', name: 'Finance & ESG', icon: DollarSign, description: 'Portfolio, risk, compliance tools.' }
    ];

    const AI_TOOLS = {
        general: [
            { id: 'general-ai', name: 'General FundCo AI', icon: Brain, description: 'Ask anything FundCo-related.' },
            { id: 'report-generator', name: 'Report Generator', icon: FileText, description: 'Generate progress reports with insights.', hasSpecialInput: true },
            { id: 'task-prioritizer', name: 'Task Prioritizer', icon: List, description: 'Prioritize tasks using frameworks.', hasSpecialInput: true },
            { id: 'effort-estimator', name: 'Effort Estimator', icon: Clock, description: 'Estimate time/resources.', hasSpecialInput: true },
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

    const REPORT_TEMPLATES = {
        daily: { title: "Daily Progress Report", greeting: "Good morning team;", summary: "Here's today's update.", completed: "Completed Today", pending: "In Progress", next: "Tomorrow's Focus", closing: "Let's keep the momentum." },
        weekly: { title: "Weekly Progress Report", greeting: "Hello team;", summary: "This week in review.", completed: "Completed This Week", pending: "Ongoing Work", next: "Next Week Priorities", closing: "Strong progress ahead." },
        monthly: { title: "Monthly Progress Report", greeting: "Team;", summary: "This month's achievements.", completed: "Completed This Month", pending: "In Progress", next: "Next Month Focus", closing: "On track and aligned." }
    };

    useEffect(() => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputs(prev => ({ ...prev, [activeListeningTool]: (prev[activeListeningTool] || '') + ' ' + transcript }));
                toast.success('Voice input added!');
            };
            recognitionRef.current.onerror = (event) => {
                toast.error('Voice recognition error: ' + event.error);
                setIsListening(false);
            };
            recognitionRef.current.onend = () => setIsListening(false);
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
        const hasFiles = selectedFiles[toolId]?.length > 0 || false;
        let body;
        if (hasFiles) {
            const formData = new FormData();
            formData.append('messages', JSON.stringify(messages));
            formData.append('taskContext', JSON.stringify(getTaskContext()));
            formData.append('toolId', toolId);
            selectedFiles[toolId].forEach(file => formData.append('files', file));
            body = formData;
        } else {
            body = JSON.stringify({
                messages,
                taskContext: JSON.stringify(getTaskContext()),
                toolId
            });
        }
        const headers = {
            'Authorization': `Bearer ${token}`
        };
        if (!hasFiles) {
            headers['Content-Type'] = 'application/json';
        }
        setIsResponding(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/grok/chat`, {
                method: 'POST',
                headers,
                body
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
            setSelectedFiles(prev => ({ ...prev, [toolId]: [] }));
            return fullContent;
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
        fetchHistory();
    }, []);

    const handleSend = (toolId) => async () => {
        const input = inputs[toolId] || '';
        if (!input.trim() && !selectedFiles[toolId]?.length) return;
        const userMessage = { role: 'user', content: input };
        setChatHistories(prev => ({ ...prev, [toolId]: [...(prev[toolId] || []), userMessage] }));
        setInputs(prev => ({ ...prev, [toolId]: '' }));
        const tempId = Date.now();
        setChatHistories(prev => ({ ...prev, [toolId]: [...(prev[toolId] || []), { role: 'assistant', content: '', id: tempId }] }));
        const fullMessages = (chatHistories[toolId] || []).concat(userMessage);
        const fullContent = await callGrok(fullMessages, toolId, (content) => {
            setChatHistories(prev => {
                const hist = prev[toolId] || [];
                const last = hist[hist.length - 1];
                if (last.id === tempId) {
                    last.content += content;
                }
                return { ...prev, [toolId]: [...hist] };
            });
        });
        fetchHistory(toolId);
    };

    const handleKeyDown = (toolId) => (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(toolId)();
        }
    };

    const clearChat = (toolId) => () => {
        setChatHistories(prev => ({ ...prev, [toolId]: [] }));
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

    const removeFile = (toolId, index) => {
        setSelectedFiles(prev => ({
            ...prev,
            [toolId]: prev[toolId].filter((_, i) => i !== index)
        }));
    };

    const renderMessageContent = (content) => {
        if (Array.isArray(content)) {
            return content.map((part, index) => {
                if (part.type === 'text') {
                    return <ReactMarkdown key={index} remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>;
                } else if (part.type === 'image_url') {
                    return <img key={index} src={part.image_url.url} alt="Attached image" className="max-w-full h-auto rounded-2xl my-2" />;
                } else {
                    return <p key={index} className="text-[var(--brand-primary)]">[Attached File]</p>;
                }
            });
        } else {
            return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>;
        }
    };

    const filteredHistories = useMemo(() => {
        return globalHistories.filter(h =>
            h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h.summary.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [globalHistories, searchQuery]);

    const debouncedSetSearchQuery = debounce(setSearchQuery, 300);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistories[selectedTool]]);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory(selectedTool);
        }
    }, [activeTab, selectedTool]);

    return (
        <>
            <Toaster position="top-center" toastOptions={{ style: { background: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: '600' } }} />
            <div className="min-h-screen bg-[var(--bg-app)] flex">
                {/* Sidebar: Categories */}
                <div className="w-64 bg-[var(--bg-surface)] border-r border-[var(--border-color)] p-4 space-y-4 overflow-y-auto scrollbar-thin">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">FundCo AI Categories</h2>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => { setSelectedCategory(cat.id); setSelectedTool(AI_TOOLS[cat.id][0].id); fetchHistory(AI_TOOLS[cat.id][0].id); }}
                            className={`w-full p-3 flex items-center gap-3 text-left rounded-3xl ${selectedCategory === cat.id ? 'bg-[var(--brand-light)] text-[var(--brand-primary)]' : 'hover:bg-[var(--bg-hover)]'}`}
                        >
                            <cat.icon className="w-5 h-5 text-[var(--brand-primary)]" />
                            <div>
                                <p className="font-medium">{cat.name}</p>
                                <p className="text-xs text-[var(--text-secondary)]">{cat.description}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6">
                    <header className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Brain className="w-8 h-8 text-[var(--brand-primary)]" />
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--text-primary)]">FundCo AI</h1>
                                <p className="text-sm text-[var(--text-secondary)]">Sector-specific AI for all AssetCos • Powered by xAI</p>
                            </div>
                        </div>
                        <button onClick={() => navigate('/')} className="flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] text-[var(--brand-primary)] rounded-3xl hover:bg-[var(--bg-hover)]">
                            <ArrowLeft className="w-5 h-5" /> Dashboard
                        </button>
                    </header>

                    <div className="flex gap-4">
                        {/* Tool Selector */}
                        <div className="w-72 space-y-4">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Tools in {CATEGORIES.find(c => c.id === selectedCategory).name}</h3>
                            <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-thin">
                                {AI_TOOLS[selectedCategory].map(tool => (
                                    <button
                                        key={tool.id}
                                        onClick={() => { setSelectedTool(tool.id); fetchHistory(tool.id); }}
                                        className={`w-full p-4 flex items-center gap-3 text-left rounded-3xl border ${selectedTool === tool.id ? 'bg-[var(--brand-light)] border-[var(--brand-primary)]' : 'hover:bg-[var(--bg-hover)] border-[var(--border-color)]'}`}
                                    >
                                        <tool.icon className="w-6 h-6 text-[var(--brand-primary)]" />
                                        <div>
                                            <p className="font-medium text-[var(--text-primary)]">{tool.name}</p>
                                            <p className="text-xs text-[var(--text-secondary)]">{tool.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chat / History Panel */}
                        <div className="flex-1 bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-6 space-y-4 shadow-lg">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">{AI_TOOLS[selectedCategory].find(t => t.id === selectedTool).name}</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => setActiveTab('chat')} className={`px-4 py-2 rounded-3xl ${activeTab === 'chat' ? 'bg-[var(--brand-primary)] text-white' : 'border border-[var(--border-color)] text-[var(--text-primary)]'}`}>Chat</button>
                                    <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-3xl ${activeTab === 'history' ? 'bg-[var(--brand-primary)] text-white' : 'border border-[var(--border-color)] text-[var(--text-primary)]'}`}>History</button>
                                    <input
                                        type="text"
                                        placeholder="Search histories..."
                                        value={searchQuery}
                                        onChange={e => debouncedSetSearchQuery(e.target.value)}
                                        className="px-3 py-2 border border-[var(--border-color)] rounded-3xl focus:ring-2 focus:ring-[var(--brand-primary)] bg-transparent text-[var(--text-primary)]"
                                    />
                                </div>
                            </div>

                            {activeTab === 'chat' ? (
                                <div className="space-y-4">
                                    {/* Special inputs for report-generator, task-prioritizer, effort-estimator */}
                                    {AI_TOOLS[selectedCategory].find(t => t.id === selectedTool).hasSpecialInput && (
                                        <div className="p-4 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-subtle)]">
                                            {selectedTool === 'report-generator' && (
                                                <div className="space-y-4">
                                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-3">
                                                        <FileText className="w-5 h-5 text-[var(--brand-primary)]" />
                                                        Generate Report
                                                    </h4>
                                                    <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full p-3 border border-[var(--border-color)] rounded-3xl text-[var(--text-primary)] bg-[var(--bg-surface)]">
                                                        <option value="daily">Daily</option>
                                                        <option value="weekly">Weekly</option>
                                                        <option value="monthly">Monthly</option>
                                                        <option value="custom">Custom</option>
                                                    </select>
                                                    {reportType === 'custom' && (
                                                        <div className="flex gap-2">
                                                            <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="flex-1 p-3 border border-[var(--border-color)] rounded-3xl text-[var(--text-primary)] bg-[var(--bg-surface)]" />
                                                            <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="flex-1 p-3 border border-[var(--border-color)] rounded-3xl text-[var(--text-primary)] bg-[var(--bg-surface)]" />
                                                        </div>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <button onClick={selectAll} className="px-3 py-1 border border-[var(--border-color)] text-[var(--brand-primary)] rounded-3xl text-sm">Select All</button>
                                                        <button onClick={clearSelection} className="px-3 py-1 border border-[var(--border-color)] text-red-500 rounded-3xl text-sm">Clear</button>
                                                    </div>
                                                    <div className="max-h-40 overflow-y-auto space-y-2">
                                                        {filteredTasks.map(task => (
                                                            <label key={task._id} className="flex items-center gap-2 text-[var(--text-primary)]">
                                                                <input type="checkbox" checked={selectedTaskIds.has(task._id)} onChange={() => toggleTask(task._id)} className="accent-[var(--brand-primary)]" />
                                                                {task.title}
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <select value={reportAudience} onChange={e => setReportAudience(e.target.value)} className="w-full p-3 border border-[var(--border-color)] rounded-3xl text-[var(--text-primary)] bg-[var(--bg-surface)]">
                                                        <option value="personal">Personal Review</option>
                                                        <option value="superior">Submit to Superior</option>
                                                    </select>
                                                    <button onClick={handleGenerateReport} disabled={isGeneratingReport} className="w-full py-3 bg-[var(--brand-primary)] text-white rounded-3xl flex items-center justify-center gap-2">
                                                        {isGeneratingReport ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Generate
                                                    </button>
                                                    {reportContent && (
                                                        <div className="mt-4 p-4 bg-[var(--bg-subtle)] rounded-3xl relative">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportContent}</ReactMarkdown>
                                                            <div className="absolute top-4 right-4 flex gap-2">
                                                                <button onClick={() => handleCopy(reportContent)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">
                                                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                                </button>
                                                                <button onClick={downloadReport} className="p-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">
                                                                    <Download className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {aiInsights.map((insight, i) => (
                                                        <div key={i} className={`p-3 rounded-3xl ${insight.level === 'success' ? 'bg-emerald-50 text-emerald-700' : insight.level === 'warn' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                                                            {insight.text}
                                                        </div>
                                                    ))}
                                                    <button onClick={handleSubmit} className="w-full py-3 bg-emerald-600 text-white rounded-3xl">Submit Report</button>
                                                </div>
                                            )}
                                            {selectedTool === 'task-prioritizer' && (
                                                <div className="space-y-4">
                                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-3">
                                                        <List className="w-5 h-5 text-[var(--brand-primary)]" />
                                                        Prioritize Tasks
                                                    </h4>
                                                    <button onClick={handlePrioritizeAll} disabled={isPrioritizing} className="w-full py-3 bg-[var(--brand-primary)] text-white rounded-3xl flex items-center justify-center gap-2">
                                                        {isPrioritizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />} Prioritize All Tasks
                                                    </button>
                                                    {prioritizeOutput && (
                                                        <div className="mt-4 p-4 bg-[var(--bg-subtle)] rounded-3xl relative">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{prioritizeOutput}</ReactMarkdown>
                                                            <div className="absolute top-4 right-4 flex gap-2">
                                                                <button onClick={() => handleCopy(prioritizeOutput)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">
                                                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                                </button>
                                                                <button onClick={() => downloadContent(prioritizeOutput, 'prioritized_tasks.md')} className="p-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">
                                                                    <Download className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {selectedTool === 'effort-estimator' && (
                                                <div className="space-y-4">
                                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-3">
                                                        <Clock className="w-5 h-5 text-[var(--brand-primary)]" />
                                                        Estimate Effort
                                                    </h4>
                                                    <input
                                                        value={effortTask}
                                                        onChange={e => setEffortTask(e.target.value)}
                                                        placeholder="Describe the task..."
                                                        className="w-full p-3 border border-[var(--border-color)] rounded-3xl text-[var(--text-primary)] bg-[var(--bg-surface)]"
                                                    />
                                                    <button onClick={handleEstimateGrok} disabled={isEstimating} className="w-full py-3 bg-[var(--brand-primary)] text-white rounded-3xl flex items-center justify-center gap-2">
                                                        {isEstimating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Estimate
                                                    </button>
                                                    {estimateOutput && (
                                                        <div className="mt-4 p-4 bg-[var(--bg-subtle)] rounded-3xl relative">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{estimateOutput}</ReactMarkdown>
                                                            <div className="absolute top-4 right-4 flex gap-2">
                                                                <button onClick={() => handleCopy(estimateOutput)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">
                                                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                                </button>
                                                                <button onClick={() => downloadContent(estimateOutput, 'effort_estimate.md')} className="p-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">
                                                                    <Download className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Chat messages */}
                                    <div className="max-h-96 overflow-y-auto space-y-4 scrollbar-thin" ref={chatContainerRef}>
                                        <AnimatePresence>
                                            {(chatHistories[selectedTool] || []).map((msg, i) => (
                                                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-3xl ${msg.role === 'user' ? 'bg-[var(--brand-light)] text-[var(--text-primary)]' : 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'}`}>
                                                    {renderMessageContent(msg.content)}
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>

                                    {/* Attached files */}
                                    {selectedFiles[selectedTool] && selectedFiles[selectedTool].length > 0 && (
                                        <div className="space-y-2 p-3 bg-[var(--bg-subtle)] rounded-3xl">
                                            <p className="text-sm font-medium text-[var(--text-secondary)]">Attached Files:</p>
                                            {selectedFiles[selectedTool].map((file, index) => (
                                                <div key={index} className="flex items-center gap-3">
                                                    <p className="text-sm text-[var(--text-primary)] flex-1 truncate">{file.name}</p>
                                                    <button onClick={() => removeFile(selectedTool, index)} className="text-red-500 hover:text-red-600">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Input bar */}
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById(`file-input-${selectedTool}`).click()}
                                            className="p-3 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--brand-primary)] rounded-3xl"
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        <input
                                            type="file"
                                            id={`file-input-${selectedTool}`}
                                            multiple
                                            accept="*/*"
                                            hidden
                                            onChange={(e) => {
                                                const newFiles = Array.from(e.target.files);
                                                setSelectedFiles(prev => ({
                                                    ...prev,
                                                    [selectedTool]: [...(prev[selectedTool] || []), ...newFiles]
                                                }));
                                            }}
                                        />
                                        <textarea
                                            value={inputs[selectedTool] || ''}
                                            onChange={e => setInputs(prev => ({ ...prev, [selectedTool]: e.target.value }))}
                                            onKeyDown={handleKeyDown(selectedTool)}
                                            placeholder="Type your message..."
                                            className="flex-1 p-3 border border-[var(--border-color)] rounded-3xl resize-none focus:ring-2 focus:ring-[var(--brand-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                                            rows={3}
                                        />
                                        <button onClick={handleSend(selectedTool)} disabled={isResponding} className="p-3 bg-[var(--brand-primary)] text-white rounded-3xl hover:bg-[var(--brand-primary)]/90 disabled:opacity-60">
                                            <Send className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => toggleVoice(selectedTool)} className="p-3 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--brand-primary)] rounded-3xl">
                                            <Mic className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <button onClick={clearChat(selectedTool)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">Clear Chat</button>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[calc(100vh-260px)] overflow-y-auto scrollbar-thin">
                                    {loadingHistory ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
                                        </div>
                                    ) : (
                                        (pastHistories[selectedTool] || []).filter(h =>
                                            h.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            h.summary?.toLowerCase().includes(searchQuery.toLowerCase())
                                        ).map(hist => {
                                            const isOpen = openHistories.has(hist._id);
                                            return (
                                                <motion.div key={hist._id} className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl overflow-hidden">
                                                    <button
                                                        onClick={() => setOpenHistories(prev => {
                                                            const newSet = new Set(prev);
                                                            if (newSet.has(hist._id)) newSet.delete(hist._id);
                                                            else newSet.add(hist._id);
                                                            return newSet;
                                                        })}
                                                        className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--bg-hover)]"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-[var(--text-primary)]">{hist.title || 'Untitled Chat'}</p>
                                                            <p className="text-xs text-[var(--text-secondary)]">{hist.summary} • {new Date(hist.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                        <ChevronRight className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                                                    </button>
                                                    <AnimatePresence>
                                                        {isOpen && (
                                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                                <div className="p-4 space-y-4 max-h-60 overflow-y-auto">
                                                                    {hist.messages.map((msg, i) => (
                                                                        <div key={i} className={`p-3 rounded-3xl ${msg.role === 'user' ? 'bg-[var(--brand-light)]' : 'bg-[var(--bg-subtle)]'}`}>
                                                                            {renderMessageContent(msg.content)}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="p-4 flex gap-2 border-t border-[var(--border-color)]">
                                                                    <button onClick={() => resumeChat(hist)} className="px-3 py-1 bg-[var(--brand-primary)] text-white rounded-3xl">Resume</button>
                                                                    <button onClick={async () => {
                                                                        await fetch(`${import.meta.env.VITE_API_URL}/api/grok/chat/${hist._id}/summarize`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
                                                                        fetchHistory(selectedTool);
                                                                    }} className="px-3 py-1 border border-[var(--border-color)] text-[var(--text-primary)] rounded-3xl">Resummarize</button>
                                                                    <button onClick={async () => {
                                                                        const newTitle = prompt('New title:', hist.title);
                                                                        const newTags = prompt('Tags (comma-separated):', hist.tags?.join(',') || '');
                                                                        if (newTitle || newTags) {
                                                                            await fetch(`${import.meta.env.VITE_API_URL}/api/grok/chat/${hist._id}`, {
                                                                                method: 'PUT',
                                                                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                                                                                body: JSON.stringify({ title: newTitle, tags: newTags ? newTags.split(',') : hist.tags })
                                                                            });
                                                                            fetchHistory(selectedTool);
                                                                        }
                                                                    }} className="px-3 py-1 border border-[var(--border-color)] text-[var(--text-primary)] rounded-3xl">Edit</button>
                                                                    <button onClick={async () => {
                                                                        if (confirm('Delete?')) {
                                                                            await fetch(`${import.meta.env.VITE_API_URL}/api/grok/chat/${hist._id}`, {
                                                                                method: 'DELETE',
                                                                                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                                                            });
                                                                            fetchHistory(selectedTool);
                                                                        }
                                                                    }} className="px-3 py-1 bg-red-500 text-white rounded-3xl">Delete</button>
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
                .scrollbar-thin::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 9999px; }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: var(--brand-primary); }
            `}</style>
        </>
    );
};

export default AiTools;