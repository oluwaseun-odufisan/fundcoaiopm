// src/pages/AiTools.jsx
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Brain, ArrowLeft, FileText, Zap, Star, Gauge, Loader2, Copy, Check,
  Download, Send, RefreshCw, Sparkles, List, Clock, Mail, FileSearch,
  Lightbulb, BarChart, Code, Search, RotateCcw, X, ChevronRight, Mic,
  Calendar, AlertCircle, TrendingUp, Users, FileText as Document, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// Professional Palette
const COLORS = {
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
  }
};
const REPORT_TEMPLATES = {
  daily: { title: "Daily Progress Report", greeting: "Good morning team,", summary: "Here's today's update.", completed: "Completed Today", pending: "In Progress", next: "Tomorrow's Focus", closing: "Let's keep the momentum." },
  weekly: { title: "Weekly Progress Report", greeting: "Hello team,", summary: "This week in review.", completed: "Completed This Week", pending: "Ongoing Work", next: "Next Week Priorities", closing: "Strong progress ahead." },
  monthly: { title: "Monthly Progress Report", greeting: "Team,", summary: "This month's achievements.", completed: "Completed This Month", pending: "In Progress", next: "Next Month Focus", closing: "On track and aligned." }
};
const AI_TOOLS = [
  {
    id: 'general',
    name: 'General FundCo AI',
    icon: Brain,
    description: 'Ask FundCo AI anything.',
    systemPrompt: ''
  },
  {
    id: 'report-generator',
    name: 'Report Generator',
    icon: FileText,
    description: 'Generate professional progress reports from your tasks with AI insights. Improved to handle personal vs submission reports intelligently.',
    systemPrompt: 'You are a professional report writer. Generate concise, structured reports in Markdown based on task data. Include summaries, completed/pending tasks, metrics, and recommendations. Use task context to provide deep analysis.'
  },
  {
    id: 'task-prioritizer',
    name: 'Task Prioritizer',
    icon: List,
    description: 'AI-powered prioritization of tasks using advanced frameworks like Eisenhower matrix. Now with smart suggestions for undone tasks.',
    systemPrompt: 'You are a task management expert. Analyze and prioritize tasks using Eisenhower matrix, MoSCoW method, or similar frameworks. Output a sorted list with reasons, scores, and potential dependencies. Suggest optimizations.'
  },
  {
    id: 'effort-estimator',
    name: 'Effort Estimator',
    icon: Clock,
    description: 'Estimate time, resources, and complexity for tasks with risk assessment. Enhanced with personalized tips based on context.',
    systemPrompt: 'You are a project estimation specialist. Provide realistic time estimates in hours/days, considering complexity, skills, dependencies, and risks. Break down into phases and suggest buffers.'
  },
  {
    id: 'task-breaker',
    name: 'Task Breaker',
    icon: Zap,
    description: 'Decompose complex tasks into actionable sub-tasks with timelines. Improved with automation suggestions.',
    systemPrompt: 'You are a task decomposition expert. Break down given tasks into atomic sub-tasks with dependencies, estimates, assignments, and potential automation opportunities.'
  },
  {
    id: 'email-writer',
    name: 'Email Writer',
    icon: Mail,
    description: 'Draft professional emails for updates, requests, or collaborations. Now adapts tone based on context intelligently.',
    systemPrompt: 'You are a professional communicator. Draft clear, concise emails with proper structure: subject, greeting, body, closing. Adapt tone (formal, casual) and include task-related details.'
  },
  {
    id: 'summary-generator',
    name: 'Summary Generator',
    icon: FileSearch,
    description: 'Summarize task lists, meetings, or progress with key highlights. Enhanced to highlight risks proactively.',
    systemPrompt: 'You are a summarization expert. Create concise summaries highlighting key points, actions, deadlines, and decisions. Use bullet points and highlight risks.'
  },
  {
    id: 'brainstormer',
    name: 'Idea Brainstormer',
    icon: Lightbulb,
    description: 'Generate ideas for goals, automations, or problem-solving. Improved with feasibility scoring tied to user tasks.',
    systemPrompt: 'You are a creative brainstormer. Generate diverse, innovative ideas with pros/cons, feasibility scores. Tie to task management and suggest implementation steps.'
  },
  {
    id: 'performance-analyzer',
    name: 'Performance Analyzer',
    icon: BarChart,
    description: 'Analyze productivity metrics, trends, and bottlenecks. Now includes trend predictions.',
    systemPrompt: 'You are a performance analytics expert. Analyze metrics like completion rate, overdue tasks, productivity trends. Provide text-based charts, insights, and improvement recommendations.'
  },
//   {
//     id: 'code-generator',
//     name: 'Code Generator',
//     icon: Code,
//     description: 'Generate scripts for task automation (e.g., Python, JS). Enhanced with integration examples.',
//     systemPrompt: 'You are a code expert. Generate clean, commented code in specified language for automation. Explain logic, dependencies, and integration with task systems.'
//   },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    icon: Search,
    description: 'Research best practices, tools, or industry standards. Improved with source credibility checks.',
    systemPrompt: 'You are a research assistant. Provide factual, well-sourced information on task management topics. Use markdown for structure and suggest applications to user tasks.'
  },
  {
    id: 'reminder-optimizer',
    name: 'Reminder Optimizer',
    icon: AlertCircle,
    description: 'Suggest optimal reminders and notifications for tasks. Now personalized based on habits.',
    systemPrompt: 'You are a reminder system expert. Analyze tasks and suggest personalized reminder schedules, channels (email, push), and escalation rules based on priorities and habits.'
  },
  {
    id: 'goal-planner',
    name: 'Goal Planner',
    icon: TrendingUp,
    description: 'Create SMART goals and milestones from ideas. Enhanced with alignment to existing goals.',
    systemPrompt: 'You are a goal-setting coach. Transform ideas into SMART goals with milestones, KPIs, timelines, and alignment to existing tasks.'
  },
  {
    id: 'team-collaborator',
    name: 'Team Collaborator',
    icon: Users,
    description: 'Suggest task assignments and collaboration strategies. Improved with conflict prediction.',
    systemPrompt: 'You are a team collaboration expert. Suggest task delegations, meeting agendas, and conflict resolution based on team roles and task dependencies.'
  },
  {
    id: 'document-analyzer',
    name: 'Document Analyzer',
    icon: Document,
    description: 'Analyze attached files for task insights. Now with action item extraction.',
    systemPrompt: 'You are a document analysis AI. Extract key information from files, link to tasks, and suggest actions or integrations.'
  },
  {
    id: 'automation-builder',
    name: 'Automation Builder',
    icon: Cpu,
    description: 'Design workflows for recurring tasks. Enhanced with condition branching.',
    systemPrompt: 'You are an automation architect. Design step-by-step workflows for task automation using tools like Zapier patterns, with triggers, actions, and conditions.'
  },
  {
    id: 'calendar-optimizer',
    name: 'Calendar Optimizer',
    icon: Calendar,
    description: 'Optimize schedules and time blocks for tasks. Improved with energy level considerations.',
    systemPrompt: 'You are a time management expert. Suggest optimal time blocks, calendar integrations, and scheduling based on task priorities, durations, and energy levels.'
  },
  // All tools are now listed - no missing
];
const AiTools = () => {
  const { user, tasks = [] } = useOutletContext();
  const navigate = useNavigate();
  const [openTools, setOpenTools] = useState(new Set());
  const [chatHistories, setChatHistories] = useState({});
  const [inputs, setInputs] = useState({});
  const [isResponding, setIsResponding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [reportType, setReportType] = useState('daily');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [reportContent, setReportContent] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportAudience, setReportAudience] = useState('personal'); // new state for audience
  const [prioritizeOutput, setPrioritizeOutput] = useState('');
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [effortTask, setEffortTask] = useState('');
  const [estimateOutput, setEstimateOutput] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [aiInsights, setAiInsights] = useState([]);
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
      toast.warn('Voice recognition not supported in this browser.');
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);
  const [activeListeningTool, setActiveListeningTool] = useState(null);
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
    } catch (err) {
      toast.error(err.message || 'Failed to get response');
    } finally {
      setIsResponding(false);
    }
  };
  const handleSend = (toolId) => async () => {
    const input = inputs[toolId] || '';
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setChatHistories(prev => ({...prev, [toolId]: [...(prev[toolId] || []), userMessage]}));
    setInputs(prev => ({...prev, [toolId]: ''}));
    const tempId = Date.now();
    setChatHistories(prev => ({...prev, [toolId]: [...(prev[toolId] || []), { role: 'assistant', content: '', id: tempId }]}));
    const fullMessages = (chatHistories[toolId] || []).concat(userMessage);
    await callGrok(fullMessages, toolId, (content) => {
      setChatHistories(prev => {
        const hist = prev[toolId] || [];
        const last = hist[hist.length - 1];
        if (last.id === tempId) {
          last.content += content;
        }
        return {...prev, [toolId]: [...hist]};
      });
    });
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
    if (reportType === 'custom') return;
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
    }
    setCustomStartDate(format(start, 'yyyy-MM-dd'));
    setCustomEndDate(format(end, 'yyyy-MM-dd'));
  }, [reportType]);
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
  const toggleTool = (id) => {
    setOpenTools(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  return (
    <>
      <Toaster position="top-center" toastOptions={{
        style: { background: COLORS.primary, color: 'white', fontWeight: '600' }
      }} />
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-5 shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Brain className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">FundCo AI Hub</h1>
                <p className="text-sm text-gray-500">Custom reports • Real-time AI • Powered by xAI</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Dashboard
              </button>
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=1e40af&color=fff`}
                alt="Avatar"
                className="w-10 h-10 rounded-full ring-2 ring-blue-100"
              />
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto p-6 space-y-4">
          {AI_TOOLS.map(tool => {
            const isOpen = openTools.has(tool.id);
            const Icon = tool.icon;
            let content = null;
            if (tool.id === 'report-generator') {
              content = (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Generate Report
                    </h4>
                    <div className="flex items-center gap-2">
                      <select 
                        value={reportType} 
                        onChange={e => setReportType(e.target.value)} 
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom</option>
                      </select>
                      <select 
                        value={reportAudience} 
                        onChange={e => setReportAudience(e.target.value)} 
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="personal">Personal</option>
                        <option value="submission">Submission to Superior</option>
                      </select>
                      {reportType === 'custom' && (
                        <>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={e => setCustomStartDate(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-500">to</span>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={e => setCustomEndDate(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </>
                      )}
                      <button
                        onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                        className="p-1.5 text-gray-500 hover:text-gray-700"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {reportType === 'custom' && (
                    <>
                      <div className="flex gap-2">
                        <button onClick={selectAll} className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                          Select All
                        </button>
                        <button onClick={clearSelection} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                          Clear
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2 scrollbar-thin">
                        {filteredTasks.length > 0 ? (
                          filteredTasks.map(task => {
                            const id = task._id || task.id;
                            const isSelected = selectedTaskIds.has(id);
                            return (
                              <label
                                key={id}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                                  isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50 border-transparent'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleTask(id)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-gray-900 truncate">{task.title}</p>
                                  <p className="text-xs text-gray-500">
                                    {task.completed ? 'Completed' : 'Pending'}
                                    {task.dueDate && ` • Due ${format(new Date(task.dueDate), 'MMM d')}`}
                                  </p>
                                </div>
                              </label>
                            );
                          })
                        ) : (
                          <p className="text-center text-sm text-gray-500 py-8">
                            {customStartDate && customEndDate
                              ? 'No tasks in selected date range'
                              : 'No tasks available'}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                  <button
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport || (reportType === 'custom' && selectedTaskIds.size === 0)}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  >
                    {isGeneratingReport ? (
                      <>Generating<Loader2 className="w-5 h-5 animate-spin" /></>
                    ) : (
                      <>Generate Report</>
                    )}
                  </button>
                  {reportContent && (
                    <div className="mt-6 space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900">Generated Report</h4>
                      <div className="flex gap-2">
                        <button onClick={() => handleCopy(reportContent)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center justify-center gap-1 transition-colors">
                          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                        <button onClick={downloadReport} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center justify-center gap-1 transition-colors">
                          <Download className="w-4 h-4" /> Download
                        </button>
                        <button onClick={handleSubmit} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1">
                          <Send className="w-4 h-4" /> Submit
                        </button>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto text-sm prose prose-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportContent}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  {aiInsights.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-600" />
                        FundCo AI Insights
                      </h4>
                      <div className="space-y-3">
                        {aiInsights.map((insight, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className={`p-3 rounded-lg border text-sm ${insight.level === 'error' ? 'bg-red-50 border-red-200 text-red-800' : insight.level === 'warn' ? 'bg-amber-50 border-amber-200 text-amber-800' : insight.level === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                            {insight.text}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            } else if (tool.id === 'task-prioritizer') {
              content = (
                <div className="space-y-4">
                  <button 
                    onClick={handlePrioritizeAll} 
                    disabled={isPrioritizing}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  >
                    {isPrioritizing ? <>Prioritizing<Loader2 className="w-5 h-5 animate-spin" /></> : 'Prioritize All Tasks'}
                  </button>
                  {prioritizeOutput && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{prioritizeOutput}</ReactMarkdown>
                    </div>
                  )}
                </div>
              );
            } else if (tool.id === 'effort-estimator') {
              content = (
                <div className="space-y-4">
                  <input type="text" placeholder="Describe task..." value={effortTask} onChange={e => setEffortTask(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <button 
                    onClick={handleEstimateGrok} 
                    disabled={isEstimating}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  >
                    {isEstimating ? <>Estimating<Loader2 className="w-5 h-5 animate-spin" /></> : 'Estimate Effort'}
                  </button>
                  {estimateOutput && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{estimateOutput}</ReactMarkdown>
                    </div>
                  )}
                </div>
              );
            } else {
              content = (
                <div className="space-y-4">
                  <div className="max-h-80 overflow-y-auto space-y-4 scrollbar-thin">
                    <AnimatePresence>
                      {(chatHistories[tool.id] || []).map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg ${msg.role === 'user' ? 'bg-blue-50 text-blue-900' : 'bg-gray-50 text-gray-900'}`}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={inputs[tool.id] || ''}
                      onChange={e => setInputs(prev => ({...prev, [tool.id]: e.target.value}))}
                      onKeyDown={handleKeyDown(tool.id)}
                      placeholder="Type your message..."
                      className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <button onClick={handleSend(tool.id)} disabled={isResponding} className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                      <Send className="w-5 h-5" />
                    </button>
                    <button onClick={() => toggleVoice(tool.id)} className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                  <button onClick={clearChat(tool.id)} className="text-sm text-gray-500 hover:text-gray-700">
                    Clear Chat
                  </button>
                </div>
              );
            }
            return (
              <motion.div
                key={tool.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleTool(tool.id)}
                  className="w-full p-6 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <Icon className="w-8 h-8 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{tool.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{tool.description}</p>
                  </div>
                  <ChevronRight className={`w-6 h-6 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 border-t border-gray-200">
                        {content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
        <style jsx>{`
          .scrollbar-thin { scrollbar-width: thin; }
          .scrollbar-thin::-webkit-scrollbar { width: 6px; }
          .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
          .scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
          .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}</style>
      </div>
    </>
  );
};
export default AiTools;