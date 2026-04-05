// src/pages/Training.jsx
// Consistent with Dashboard.jsx / CalendarView.jsx layout structure
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';
import {
  BookOpen, Search, Filter, ChevronDown, Award, Clock, CheckCircle2,
  BarChart2, Lock, Play, RotateCcw, Flag, ChevronLeft, ChevronRight,
  AlertCircle, X, Send, Bot, Loader2, Minimize2,
  GraduationCap, Zap, TrendingUp, Star, MessageCircle,
  CheckSquare, Info, Sparkles, Download, Shield
} from 'lucide-react';

const API  = import.meta.env.VITE_API_URL;
const hdrs = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const LEVELS  = ['beginner','intermediate','expert'];
const ASSETCOS = ['General','EML','GroSolar','Agronomie','SSM'];
const LVL = {
  beginner:     { label:'Beginner',     cls:'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',   dot:'bg-green-500'  },
  intermediate: { label:'Intermediate', cls:'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',   dot:'bg-amber-500'  },
  expert:       { label:'Expert',       cls:'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400', dot:'bg-purple-500' },
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY: safe content renderer
// ─────────────────────────────────────────────────────────────────────────────
function renderContent(raw) {
  const text = (raw != null ? String(raw) : '').trim();
  if (!text) return <p className="text-gray-400 italic text-sm">No content available for this module.</p>;
  return text.split('\n').map((line, i) => {
    const t = line.trim();
    if (!t) return <div key={i} className="h-2" />;
    if (/^[A-Z0-9 &()/:–\-·]{5,65}$/.test(t) && t === t.toUpperCase() && t.length < 65)
      return <h3 key={i} className="text-xs font-extrabold tracking-widest text-blue-600 dark:text-blue-400 uppercase mt-6 mb-2 border-b border-blue-100 dark:border-blue-900/50 pb-1">{t}</h3>;
    if (/^[●•·▪▸✓✗\-–]\s/.test(t) || /^\d+[.):]\s/.test(t)) {
      const c = t.replace(/^[●•·▪▸✓✗\-–]\s|^\d+[.):]\s/, '');
      return <div key={i} className="flex gap-2 my-1"><span className="text-blue-500 flex-shrink-0 mt-1 text-xs">›</span><span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{c}</span></div>;
    }
    return <p key={i} className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed mb-2">{t}</p>;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AI CHAT PANEL (floating, collapsible)
// ─────────────────────────────────────────────────────────────────────────────
function AIMentorPanel({ courseId = null, moduleId = null }) {
  const [open,      setOpen]      = useState(false);
  const [msgs,      setMsgs]      = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [showLabel, setShowLabel] = useState(() => !localStorage.getItem('lms-ai-seen'));
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  // Hide the "Ask AI" label after first interaction
  useEffect(() => {
    if (open && showLabel) {
      setShowLabel(false);
      localStorage.setItem('lms-ai-seen', '1');
    }
  }, [open]);

  const SUGGESTIONS = courseId
    ? ['Summarise this course', 'What should I study first?', 'Give me practice questions', 'Explain the key concepts']
    : ['Where should I start?', 'What is PuE?', 'Explain the LOTO procedure', 'What is the GroSolar SaaS model?'];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setMsgs(m => [...m, { role:'user', text: q }]);
    setInput('');
    setLoading(true);
    try {
      const r = await axios.post(`${API}/api/learning/ai-query`, { question: q, courseId, moduleId }, hdrs());
      setMsgs(m => [...m, { role:'bot', text: r.data.answer || 'No response received.' }]);
    } catch {
      setMsgs(m => [...m, { role:'bot', text: "I'm having trouble connecting right now. Please try again." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0,y:12,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:12,scale:.96}} transition={{duration:.2}}
            className="w-80 sm:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">AI Mentor</p>
                  <p className="text-blue-100 text-xs">FundCo Knowledge Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Online"/>
                <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition">
                  <Minimize2 className="w-4 h-4"/>
                </button>
              </div>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-72 bg-gray-50 dark:bg-gray-900/40">
              {msgs.length === 0 && (
                <div className="text-center py-6">
                  <Sparkles className="w-8 h-8 text-blue-300 mx-auto mb-2"/>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Ask me anything about FundCo training materials, SOPs, or company knowledge.</p>
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${m.role==='user'?'bg-blue-600 text-white rounded-br-sm':'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-600 rounded-bl-sm shadow-sm'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl rounded-bl-sm px-3 py-2 flex gap-1">
                    {[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}
                  </div>
                </div>
              )}
              <div ref={endRef}/>
            </div>
            {/* Suggestion chips */}
            {msgs.length < 2 && (
              <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s,i) => (
                  <button key={i} onClick={()=>send(s)}
                    className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full px-2.5 py-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {/* Input */}
            <form onSubmit={e=>{e.preventDefault();send();}} className="flex border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} disabled={loading}
                placeholder="Ask a question…"
                className="flex-1 px-3 py-2.5 text-sm bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none"/>
              <button type="submit" disabled={!input.trim()||loading}
                className="px-3 text-blue-600 dark:text-blue-400 disabled:opacity-30 hover:text-blue-800 transition">
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Floating button — labeled on first visit */}
      <div className="flex items-center gap-3">
        <AnimatePresence>
          {showLabel && !open && (
            <motion.div initial={{opacity:0,x:16,scale:.95}} animate={{opacity:1,x:0,scale:1}} exit={{opacity:0,x:16}}
              className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-2xl shadow-xl px-4 py-2.5 flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-300 pointer-events-none whitespace-nowrap">
              <Bot className="w-4 h-4 text-blue-600"/>
              Ask AI Mentor
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button whileHover={{scale:1.08}} whileTap={{scale:.95}}
          onClick={() => setOpen(v=>!v)}
          className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full shadow-xl flex items-center justify-center text-white hover:shadow-2xl transition-all relative"
          title="Ask AI Mentor — instant answers about any course or FundCo topic">
          {open ? <X className="w-6 h-6"/> : <Bot className="w-6 h-6"/>}
          {!open && (
            <>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"/>
              <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-30"/>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function CertModal({ course, user, onClose }) {
  const date = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  const name  = user?.fullName || user?.name || 'Staff Member';
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{scale:.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.9,opacity:0}}
        onClick={e=>e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Cert body */}
        <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',backgroundSize:'20px 20px'}}/>
          <div className="relative">
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Award className="w-9 h-9 text-yellow-900"/>
            </div>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">FundCo Capital Managers</p>
            <h2 className="text-white text-2xl font-black mb-1">Certificate of Completion</h2>
            <p className="text-blue-200 text-sm mb-4">This certifies that</p>
            <p className="text-white text-3xl font-black mb-4" style={{fontFamily:'Georgia,serif'}}>{name}</p>
            <p className="text-blue-100 text-sm mb-2">has successfully completed</p>
            <p className="text-yellow-300 text-xl font-bold mb-4">"{course?.title}"</p>
            <p className="text-blue-200 text-xs">Awarded on {date}</p>
          </div>
        </div>
        <div className="p-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">Close</button>
          <button onClick={()=>{ toast.success('Certificate saved! (print from browser)'); window.print(); }}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
            <Download className="w-4 h-4"/> Save / Print
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function QuizComponent({ quiz, moduleTitle, previousScore, onComplete }) {
  const [phase, setPhase] = useState('intro');
  const [cur,   setCur]   = useState(0);
  const [sel,   setSel]   = useState(null);
  const [conf,  setConf]  = useState(false);
  const [ans,   setAns]   = useState([]);
  const [score, setScore] = useState(null);

  if (!Array.isArray(quiz) || !quiz.length)
    return <p className="text-center text-gray-400 py-8 text-sm">No quiz questions for this module.</p>;

  const q   = quiz[cur];
  const next = () => {
    const a = [...ans, { q:q?.question||'', sel, correct:q?.answer||'', ok:sel===q?.answer, expl:q?.explanation||'' }];
    setAns(a);
    if (cur + 1 < quiz.length) { setCur(c=>c+1); setSel(null); setConf(false); }
    else { setScore(Math.round((a.filter(x=>x.ok).length/quiz.length)*100)); setPhase('review'); }
  };
  const reset = () => { setCur(0); setSel(null); setConf(false); setAns([]); setScore(null); setPhase('taking'); };

  if (phase === 'intro') return (
    <div className="text-center py-8">
      <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckSquare className="w-7 h-7 text-blue-600 dark:text-blue-400"/>
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Module Quiz</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{moduleTitle}</p>
      <div className="flex justify-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <span>{quiz.length} questions</span>
        {previousScore != null && <span>Best: <strong className={previousScore>=70?'text-green-600':'text-red-500'}>{previousScore}%</strong></span>}
      </div>
      <p className="text-xs text-gray-400 mb-4">Passing score: 70% • Explanations shown after each answer</p>
      <button onClick={()=>setPhase('taking')} className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition">
        Start Quiz →
      </button>
    </div>
  );

  if (phase === 'done') return (
    <div className="text-center py-8">
      <div className="text-5xl mb-3">{score>=70?'🎉':'📚'}</div>
      <div className={`text-4xl font-black mb-2 ${score>=70?'text-green-600 dark:text-green-400':'text-amber-500'}`}>{score}%</div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{ans.filter(a=>a.ok).length}/{quiz.length} correct</p>
      <button onClick={reset} className="text-sm border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">↺ Try Again</button>
    </div>
  );

  if (phase === 'review') return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div><h3 className="font-bold text-gray-900 dark:text-gray-100">Quiz Results</h3><p className="text-sm text-gray-500">{ans.filter(a=>a.ok).length}/{quiz.length} correct</p></div>
        <div className={`text-3xl font-black ${score>=70?'text-green-600':'text-amber-500'}`}>{score}%</div>
      </div>
      <div className="space-y-2.5 mb-4 max-h-64 overflow-y-auto pr-1">
        {ans.map((a,i)=>(
          <div key={i} className={`p-3 rounded-lg border text-sm ${a.ok?'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800':'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
            <div className="flex gap-2 font-medium text-gray-800 dark:text-gray-200 mb-1"><span>{a.ok?'✅':'❌'}</span><span>{a.q}</span></div>
            {!a.ok && <div className="pl-6 text-xs space-y-0.5"><div className="text-red-600 dark:text-red-400">Your answer: {a.sel}</div><div className="text-green-600 dark:text-green-400">Correct: {a.correct}</div></div>}
            {a.expl && <p className="pl-6 mt-1 text-xs text-gray-500 dark:text-gray-400">💡 {a.expl}</p>}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={reset} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"><RotateCcw className="w-3.5 h-3.5"/>Retry</button>
        <button onClick={()=>{onComplete?.(score);setPhase('done');}} className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">Continue →</button>
      </div>
    </div>
  );

  // taking
  if (!q) return null;
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all" style={{width:`${(cur/quiz.length)*100}%`}}/>
        </div>
        <span className="text-xs font-semibold text-gray-400">{cur+1}/{quiz.length}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={cur} initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-12}} transition={{duration:.16}}>
          <p className="font-bold text-gray-900 dark:text-gray-100 text-base leading-snug mb-5">{q.question}</p>
          <div className="space-y-2.5 mb-5">
            {(q.options||[]).map((opt,i)=>{
              let cls = 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50';
              if (conf) {
                if (opt===q.answer) cls='border-green-400 bg-green-50 dark:bg-green-900/30 dark:border-green-600';
                else if (opt===sel) cls='border-red-400 bg-red-50 dark:bg-red-900/30 dark:border-red-600';
              } else if (opt===sel) cls='border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500';
              return (
                <button key={i} disabled={conf} onClick={()=>setSel(opt)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all ${cls}`}>
                  <span className={`w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all ${opt===sel?'bg-blue-600 border-blue-600 text-white':conf&&opt===q.answer?'bg-green-500 border-green-500 text-white':'border-gray-300 dark:border-gray-500 text-gray-500'}`}>
                    {String.fromCharCode(65+i)}
                  </span>
                  <span className="flex-1 text-gray-700 dark:text-gray-200">{opt}</span>
                  {conf&&opt===q.answer&&<CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0"/>}
                  {conf&&opt===sel&&opt!==q.answer&&<X className="w-4 h-4 text-red-500 flex-shrink-0"/>}
                </button>
              );
            })}
          </div>
          {conf&&q.explanation&&(
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
              className={`p-3 rounded-lg text-sm mb-4 ${sel===q.answer?'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800':'bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'}`}>
              <span className="font-semibold">{sel===q.answer?'✅ Correct! ':'❌ Not quite — '}</span>
              <span className="text-gray-600 dark:text-gray-300">{q.explanation}</span>
            </motion.div>
          )}
          <div className="flex justify-end">
            {!conf
              ? <button onClick={()=>setConf(true)} disabled={!sel} className="bg-blue-600 dark:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition">Check Answer</button>
              : <button onClick={next} className="bg-green-600 dark:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition">{cur+1<quiz.length?'Next →':'See Results'}</button>
            }
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL EXAM VIEW
// ─────────────────────────────────────────────────────────────────────────────
function ExamView({ course, onBack, onComplete }) {
  const [phase,   setPhase]   = useState('loading');
  const [qs,      setQs]      = useState([]);
  const [passing, setPassing] = useState(70);
  const [cur,     setCur]     = useState(0);
  const [answers, setAnswers] = useState([]);
  const [flagged, setFlagged] = useState(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [result,  setResult]  = useState(null);
  const [revIdx,  setRevIdx]  = useState(0);
  const timer = useRef(null);
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  useEffect(()=>{
    axios.get(`${API}/api/learning/exam/${course._id}`, hdrs())
      .then(r=>{ const q=r.data.questions||[]; setQs(q); setAnswers(new Array(q.length).fill(null)); setPassing(r.data.passingScore||70); setPhase('intro'); })
      .catch(()=>{ toast.error('Failed to load exam'); onBack(); });
  },[]);

  const startTimer = ()=>{ timer.current=setInterval(()=>setElapsed(e=>e+1),1000); };
  const stopTimer  = ()=>clearInterval(timer.current);
  useEffect(()=>()=>stopTimer(),[]);

  const submit = async ()=>{
    stopTimer(); setPhase('grading');
    try {
      const r = await axios.post(`${API}/api/learning/exam/submit`,{courseId:course._id,answers:answers.map(a=>a||''),timeSpent:elapsed},hdrs());
      setResult(r.data); setPhase('result');
    } catch { toast.error('Submission failed'); setPhase('taking'); startTimer(); }
  };

  const q = qs[cur];
  const answered = answers.filter(a=>a!==null).length;

  if (phase==='loading'||phase==='grading') return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>
      <p className="text-sm text-gray-500">{phase==='loading'?'Loading exam questions…':'Grading your answers…'}</p>
    </div>
  );

  if (phase==='intro') return (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
        <GraduationCap className="w-10 h-10 text-amber-500"/>
      </div>
      <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-1">Final Course Exam</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{course.title}</p>
      <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-6">
        {[{n:qs.length,l:'Questions'},{n:`${passing}%`,l:'Pass Mark'},{n:'Timed',l:'Format'}].map(s=>(
          <div key={s.l} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
            <div className="text-xl font-black text-blue-600 dark:text-blue-400">{s.n}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 max-w-sm mx-auto mb-6 text-left space-y-2">
        {['Select one answer per question','Flag questions to review later','Full explanations shown after submission','Certificate awarded on passing'].map((r,i)=>(
          <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0"/>{r}
          </div>
        ))}
      </div>
      <button onClick={()=>{setPhase('taking');startTimer();}} className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-bold text-base transition shadow-lg hover:shadow-xl">
        Begin Exam →
      </button>
    </div>
  );

  if (phase==='result'&&result) {
    const {score,passed,correct,total,answers:graded,questions:rqArr}=result;
    const rq=rqArr?.[revIdx]||{};const ra=graded?.[revIdx]||{};
    return (
      <div className="space-y-5">
        <div className={`rounded-2xl p-5 flex items-center gap-4 ${passed?'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800':'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
          <div className="text-5xl">{passed?'🎓':'📚'}</div>
          <div className="flex-1">
            <div className="font-black text-lg text-gray-900 dark:text-gray-100">{passed?'Congratulations — You Passed!':'Not quite — Keep going!'}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{correct}/{total} correct · {fmt(elapsed)} taken</div>
            {!passed&&<div className="text-xs text-gray-400 mt-1">You need {passing}% to pass. Review the explanations and try again.</div>}
          </div>
          <div className={`text-4xl font-black ${passed?'text-green-600':'text-red-500'}`}>{score}%</div>
        </div>
        {/* Review */}
        {rqArr?.length>0&&(
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3 text-sm">Question Review — click a number to review</h3>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {graded.map((a,i)=>(
                <button key={i} onClick={()=>setRevIdx(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold border transition ${a.correct?'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400':'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400'}${i===revIdx?' ring-2 ring-blue-400 ring-offset-1':''}`}>
                  {i+1}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={revIdx} initial={{opacity:0,x:6}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-6}} transition={{duration:.14}}>
                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-3">Q{revIdx+1}. {rq.question}</p>
                <div className="space-y-2 mb-3">
                  {(rq.options||[]).map((opt,i)=>{
                    const ok=opt===rq.answer,wrong=opt===ra.selectedAnswer&&!ok;
                    return <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${ok?'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700':wrong?'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700':'bg-gray-50 border-gray-200 dark:bg-gray-700/30 dark:border-gray-600'}`}>
                      <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{String.fromCharCode(65+i)}</span>
                      <span className="flex-1">{opt}</span>
                      {ok&&<CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0"/>}
                      {wrong&&<X className="w-4 h-4 text-red-500 flex-shrink-0"/>}
                    </div>;
                  })}
                </div>
                {ra.explanation&&<p className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">💡 {ra.explanation}</p>}
                <div className="flex justify-between mt-3">
                  <button onClick={()=>setRevIdx(i=>Math.max(0,i-1))} disabled={revIdx===0} className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition">← Prev</button>
                  <button onClick={()=>setRevIdx(i=>Math.min(total-1,i+1))} disabled={revIdx===total-1} className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition">Next →</button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={()=>{setAnswers(new Array(qs.length).fill(null));setFlagged(new Set());setCur(0);setElapsed(0);setResult(null);setPhase('intro');}}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <RotateCcw className="w-4 h-4"/> Retake
          </button>
          <button onClick={()=>onComplete?.(score)} className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            {passed?'🎓 View My Certificate':'Back to Course'}
          </button>
        </div>
      </div>
    );
  }

  if (!q) return null;
  return (
    <div>
      {/* Exam header bar */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">Q {cur+1}/{qs.length}</span>
        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all" style={{width:`${(answered/qs.length)*100}%`}}/>
        </div>
        <span className="text-xs text-gray-400">{answered} answered</span>
        <div className="flex items-center gap-1 ml-2 text-sm font-bold text-gray-700 dark:text-gray-300 flex-shrink-0">
          <Clock className="w-3.5 h-3.5 text-blue-500"/>{fmt(elapsed)}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[140px,1fr] gap-4">
        {/* Q grid */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Navigator</p>
          <div className="grid grid-cols-5 lg:grid-cols-4 gap-1">
            {qs.map((_,i)=>(
              <button key={i} onClick={()=>setCur(i)}
                className={`aspect-square rounded-lg text-xs font-bold border transition ${
                  i===cur?'bg-blue-600 border-blue-600 text-white ring-2 ring-blue-300 ring-offset-1':
                  answers[i]?'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400':
                  flagged.has(i)?'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700':
                  'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-700/30 dark:border-gray-600'}`}>
                {i+1}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-1 text-xs text-gray-400">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-300 dark:bg-green-900/30 dark:border-green-700 inline-block"/> Answered</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 dark:bg-amber-900/30 dark:border-amber-700 inline-block"/> Flagged</div>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={cur} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:.15}}>
            <p className="font-bold text-gray-900 dark:text-gray-100 text-base leading-snug mb-5">{q.question}</p>
            <div className="space-y-2.5 mb-5">
              {(q.options||[]).map((opt,i)=>(
                <button key={i} onClick={()=>{const a=[...answers];a[cur]=opt;setAnswers(a);}}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all ${
                    answers[cur]===opt?'border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500':'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/30 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'}`}>
                  <span className={`w-7 h-7 rounded-full border flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all ${answers[cur]===opt?'bg-blue-600 border-blue-600 text-white':'border-gray-300 dark:border-gray-500 text-gray-400'}`}>
                    {String.fromCharCode(65+i)}
                  </span>
                  <span className="flex-1 text-gray-700 dark:text-gray-200">{opt}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={()=>setCur(i=>Math.max(0,i-1))} disabled={cur===0} className="flex items-center gap-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition"><ChevronLeft className="w-4 h-4"/>Prev</button>
              <button onClick={()=>setFlagged(f=>{const n=new Set(f);n.has(cur)?n.delete(cur):n.add(cur);return n;})}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm border transition ${flagged.has(cur)?'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/20 dark:border-amber-600':'border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <Flag className="w-3.5 h-3.5"/>{flagged.has(cur)?'Unflag':'Flag'}
              </button>
              {cur<qs.length-1
                ? <button onClick={()=>setCur(i=>i+1)} className="ml-auto flex items-center gap-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition">Next <ChevronRight className="w-4 h-4"/></button>
                : <button onClick={()=>{if(answered<qs.length&&!window.confirm(`${qs.length-answered} unanswered. Submit anyway?`))return;submit();}} className="ml-auto px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition">Submit ✓</button>
              }
            </div>
            {answered===qs.length&&(
              <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
                className="flex items-center justify-between mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <span className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/>All {qs.length} questions answered!</span>
                <button onClick={submit} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition">Submit →</button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COURSE VIEWER
// ─────────────────────────────────────────────────────────────────────────────
function CourseViewer({ courseId, progress, onBack, onProgressUpdate, user }) {
  const [course,    setCourse]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [modIdx,    setModIdx]    = useState(0);
  const [tab,       setTab]       = useState('content');
  const [showExam,  setShowExam]  = useState(false);
  const [showCert,  setShowCert]  = useState(false);
  const [doneIds,   setDoneIds]   = useState(new Set());
  const [modProg,   setModProg]   = useState([]);
  const [pct,       setPct]       = useState(0);
  const [saving,    setSaving]    = useState(false);
  const [notes,     setNotes]     = useState(()=>{
    try{return JSON.parse(localStorage.getItem(`lms-notes-${courseId}`)||'{}');}catch{return{};}
  });
  const [showNotes, setShowNotes] = useState(false);
  const notesTimer = useRef(null);

  // Save notes to localStorage with debounce
  const saveNote = (modId, text) => {
    const updated = {...notes, [modId]: text};
    setNotes(updated);
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(()=>{ localStorage.setItem(`lms-notes-${courseId}`, JSON.stringify(updated)); }, 600);
  };

  useEffect(()=>{
    let c=false; setLoading(true); setError(false);
    axios.get(`${API}/api/learning/courses/${courseId}`, hdrs())
      .then(r=>{
        if(c)return; const crs=r.data.course;
        if(!crs){setError(true);return;}
        crs.modules=(crs.modules||[]).map(m=>({...m,content:m.content!=null?String(m.content):'',title:m.title!=null?String(m.title):'Untitled',quiz:Array.isArray(m.quiz)?m.quiz:[],terms:Array.isArray(m.terms)?m.terms:[],objectives:Array.isArray(m.objectives)?m.objectives:[]}));
        setCourse(crs);
        // Restore last viewed module position
        const lastMod = localStorage.getItem(`lms-lastmod-${courseId}`);
        if(lastMod) {
          const idx = crs.modules.findIndex(m=>String(m._id)===lastMod);
          if(idx>0) setModIdx(idx);
        }
      })
      .catch(()=>{if(!c)setError(true);})
      .finally(()=>{if(!c)setLoading(false);});
    return()=>{c=true;};
  },[courseId]);

  useEffect(()=>{
    if(progress){setDoneIds(new Set((progress.completedModules||[]).map(String)));setModProg(progress.moduleProgress||[]);setPct(progress.progress||0);}
  },[progress]);

  useEffect(()=>{
    setTab('content');
    // Remember which module user was on
    if(courseId) localStorage.setItem(`lms-lastmod-${courseId}`, String((course?.modules||[])[modIdx]?._id||''));
  },[modIdx]);

  if(loading) return <div className="flex flex-col items-center justify-center py-16 gap-3"><div className="w-9 h-9 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"/><p className="text-sm text-gray-500">Loading course…</p></div>;
  if(error||!course) return <div className="text-center py-12"><AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3"/><p className="text-gray-500 mb-4 text-sm">Could not load this course.</p><button onClick={onBack} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">← Go Back</button></div>;

  const mods     = course.modules||[];
  const mod      = mods[modIdx];
  if(!mods.length||!mod) return <div className="text-center py-12"><p className="text-gray-500 mb-4 text-sm">This course has no modules yet.</p><button onClick={onBack} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">← Go Back</button></div>;

  const isDone   = id => doneIds.has(String(id));
  const mp       = modProg.find(x=>String(x.moduleId)===String(mod._id));
  const allDone  = mods.every(m=>isDone(m._id));
  const bestExam = progress?.bestExamScore||0;
  const examPassed = bestExam>=(course.passingScore||70);
  const lm       = LVL[course.level]||LVL.beginner;
  const cert     = progress?.certificationEarned;

  const markComplete = async (quizScore=null)=>{
    if(!mod||saving)return; setSaving(true);
    try {
      const body={courseId:course._id,moduleId:mod._id};
      if(quizScore!=null)body.quizScore=quizScore;
      const r=await axios.post(`${API}/api/learning/module-progress`,body,hdrs());
      const u=r.data.progress;
      setDoneIds(new Set((u.completedModules||[]).map(String)));
      setModProg(u.moduleProgress||[]); setPct(u.progress||0);
      onProgressUpdate?.(); toast.success('Progress saved!');
      if(quizScore==null&&modIdx<mods.length-1)setTimeout(()=>setModIdx(i=>i+1),600);
    } catch { toast.error('Failed to save progress'); }
    finally { setSaving(false); }
  };

  const tabs=[
    {id:'content',label:'📖 Lesson',  show:true},
    {id:'video',  label:'▶ Video',   show:!!mod.videoUrl},
    {id:'terms',  label:'📝 Terms',  show:!!(mod.terms?.length)},
    {id:'quiz',   label:'✅ Quiz',    show:!!(mod.quiz?.length)},
    {id:'notes',  label:'📓 Notes',   show:true},
  ].filter(t=>t.show);

  const embedUrl=url=>{
    if(!url)return null;
    if(url.includes('playlist?list=')){const id=url.split('list=')[1]?.split('&')[0];return`https://www.youtube.com/embed/videoseries?list=${id}&rel=0&modestbranding=1`;}
    if(url.includes('watch?v=')){const id=url.split('v=')[1]?.split('&')[0];return`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;}
    return null;
  };

  if(showExam) return (
    <div>
      <button onClick={()=>setShowExam(false)} className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-5 hover:opacity-75 transition">
        <ChevronLeft className="w-4 h-4"/> Back to Course
      </button>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
        <ExamView course={course} onBack={()=>setShowExam(false)} onComplete={score=>{
          setShowExam(false); onProgressUpdate?.();
          if(score>=(course.passingScore||70)){ toast.success(`🎓 Passed! ${score}%`,{duration:4000}); setShowCert(true); }
          else toast.error(`${score}% — Need ${course.passingScore||70}%`,{duration:4000});
        }}/>
      </div>
      <AIMentorPanel courseId={course._id}/>
    </div>
  );

  return (
    <div>
      {/* Certificate modal */}
      <AnimatePresence>{(showCert||cert)&&showCert&&<CertModal course={course} user={user} onClose={()=>setShowCert(false)}/>}</AnimatePresence>

      {/* ── EXAM CALL-TO-ACTION BANNER ── always visible when course has exam */}
      {course.exam?.length > 0 && (
        <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}}
          className={`mb-4 p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
            examPassed
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              : allDone
                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-700'
                : 'bg-gray-50 border-gray-200 dark:bg-gray-700/30 dark:border-gray-600'
          }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${examPassed?'bg-green-500':allDone?'bg-amber-500':'bg-gray-400'}`}>
            {examPassed ? <Shield className="w-5 h-5 text-white"/> : allDone ? <GraduationCap className="w-5 h-5 text-white"/> : <Lock className="w-5 h-5 text-white"/>}
          </div>
          <div className="flex-1 min-w-0">
            {examPassed ? (
              <>
                <p className="font-bold text-green-800 dark:text-green-300 text-sm">🎓 You've passed this exam!</p>
                <p className="text-xs text-green-700 dark:text-green-400">Best score: {bestExam}% · {course.exam.length} questions · Certificate earned</p>
              </>
            ) : allDone ? (
              <>
                <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">🎯 All modules complete — Take your Final Exam!</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">{course.exam.length} questions · {course.passingScore||70}% to pass · Certificate awarded on passing</p>
              </>
            ) : (
              <>
                <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">📝 Final Exam — Complete all modules to unlock</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{doneIds.size}/{mods.length} modules done · {course.exam.length} questions · {course.passingScore||70}% to pass</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {examPassed && (
              <button onClick={()=>setShowCert(true)} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition">
                <Award className="w-4 h-4"/> Certificate
              </button>
            )}
            <button
              disabled={!allDone}
              onClick={()=>{ if(allDone) setShowExam(true); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition ${
                !allDone?'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed':
                examPassed?'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200':
                'bg-amber-500 hover:bg-amber-600 text-white shadow-lg hover:shadow-xl'
              }`}>
              {!allDone?<><Lock className="w-4 h-4"/>Locked</>:examPassed?<><RotateCcw className="w-4 h-4"/>Retake</>:<><Zap className="w-4 h-4"/>Start Exam</>}
            </button>
          </div>
        </motion.div>
      )}

      {/* ── COURSE LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px,1fr] gap-5">
        {/* Module sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm lg:sticky lg:top-4">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Course Content</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{doneIds.size}/{mods.length} done</span>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-gray-100 dark:bg-gray-700">
              <div className="h-full bg-blue-600 transition-all duration-500" style={{width:`${pct}%`}}/>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {mods.map((m,i)=>{
                const done=isDone(m._id),active=i===modIdx;
                return (
                  <button key={m._id||i} onClick={()=>setModIdx(i)}
                    className={`w-full flex items-start gap-2.5 px-3.5 py-3 border-b border-gray-100 dark:border-gray-700/50 text-left transition-all ${active?'bg-blue-50 dark:bg-blue-900/30':'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                    <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 text-xs font-bold ${done?'bg-green-500 text-white':active?'bg-blue-600 text-white':'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'}`}>
                      {done?<CheckCircle2 className="w-3 h-3"/>:i+1}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold leading-snug ${active?'text-blue-700 dark:text-blue-300':done?'text-green-700 dark:text-green-400':'text-gray-700 dark:text-gray-300'}`}>{m.title||`Module ${i+1}`}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {m.estimatedMinutes&&<p className="text-xs text-gray-400">{m.estimatedMinutes}min</p>}
                        {m.quiz?.length>0&&<span className="text-xs text-blue-400">· Quiz</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Exam entry in sidebar */}
            {course.exam?.length>0&&(
              <div className={`p-3 border-t ${examPassed?'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800':'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <GraduationCap className={`w-4 h-4 ${examPassed?'text-green-600':'text-amber-500'}`}/>
                  <span className={`text-xs font-bold ${examPassed?'text-green-700 dark:text-green-400':'text-amber-700 dark:text-amber-400'}`}>{examPassed?'Exam Passed ✓':'Final Exam'}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{course.exam.length}Q · {course.passingScore||70}% pass{bestExam>0?` · Best: ${bestExam}%`:''}</p>
                {!allDone&&<p className="text-xs text-amber-600 dark:text-amber-500 mb-2 flex items-center gap-1"><Lock className="w-3 h-3"/>Complete all modules first</p>}
                <button disabled={!allDone} onClick={()=>setShowExam(true)}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition ${allDone?examPassed?'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300':'bg-amber-500 hover:bg-amber-600 text-white':'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
                  {examPassed?'Retake Exam':allDone?'📝 Start Exam →':'🔒 Locked'}
                </button>
                {examPassed&&<button onClick={()=>setShowCert(true)} className="w-full mt-1.5 py-1.5 rounded-lg text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition flex items-center justify-center gap-1">
                  <Award className="w-3 h-3"/>View Certificate
                </button>}
              </div>
            )}

            {/* AI Mentor entry */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-center gap-2 mb-1.5">
                <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400"/>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">AI Mentor</span>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-auto"/>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Ask questions about this course, get explanations, and practice with AI-generated questions.</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                <MessageCircle className="w-3 h-3"/>Click the blue chat button (bottom-right) →
              </p>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
          {/* Module header */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Module {modIdx+1} of {mods.length} · {course.assetco}</p>
                <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 leading-snug">{mod.title||`Module ${modIdx+1}`}</h2>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${lm.cls}`}>{lm.label}</span>
                {isDone(mod._id)&&<span className="text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/>Done</span>}
              </div>
            </div>
            {mod.objectives?.length>0&&(
              <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Star className="w-3 h-3"/>Learning Objectives</p>
                {mod.objectives.map((o,i)=><div key={i} className="flex gap-2 text-xs text-gray-600 dark:text-gray-300 mb-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"/><span>{o}</span></div>)}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 overflow-x-auto gap-1">
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${tab===t.id?'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-white dark:bg-gray-800':'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} transition={{duration:.16}}
              className="p-5 min-h-[320px]">
              {tab==='content'&&(
                <div className="max-w-3xl">
                  {renderContent(mod.content)}
                  {!isDone(mod._id)&&(
                    <button onClick={()=>markComplete()} disabled={saving}
                      className="mt-6 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50">
                      <CheckCircle2 className="w-4 h-4"/>{saving?'Saving…':'Mark as Complete'}
                    </button>
                  )}
                </div>
              )}
              {tab==='video'&&mod.videoUrl&&(
                embedUrl(mod.videoUrl)
                  ? <iframe src={embedUrl(mod.videoUrl)} title={mod.title} frameBorder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowFullScreen className="w-full aspect-video rounded-xl"/>
                  : <a href={mod.videoUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-3 p-10 bg-gray-50 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                      <Play className="w-8 h-8"/>Open Resource ↗
                    </a>
              )}
              {tab==='terms'&&mod.terms?.length>0&&(
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mod.terms.map((t,i)=>(
                    <motion.div key={i} initial={{opacity:0,scale:.98}} animate={{opacity:1,scale:1}} transition={{delay:i*.025}}
                      className="bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl p-3.5 border-l-4 border-l-blue-500">
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1.5">{t.term}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{t.definition}</p>
                    </motion.div>
                  ))}
                </div>
              )}
              {tab==='quiz'&&mod.quiz?.length>0&&(
                <QuizComponent quiz={mod.quiz} moduleTitle={mod.title} previousScore={mp?.quizScore} onComplete={score=>markComplete(score)}/>
              )}
              {tab==='notes'&&(
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">My Notes</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Personal notes for this module — saved locally in your browser</p>
                    </div>
                    {notes[mod._id]&&<button onClick={()=>saveNote(mod._id,'')} className="text-xs text-red-400 hover:text-red-600 transition">Clear</button>}
                  </div>
                  <textarea
                    value={notes[mod._id]||''}
                    onChange={e=>saveNote(mod._id,e.target.value)}
                    placeholder="Write your notes, key takeaways, questions, or ideas here…"
                    className="w-full h-48 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none resize-none leading-relaxed"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                    <span>{(notes[mod._id]||'').length} characters</span>
                    <span className="flex items-center gap-1 text-green-500"><CheckCircle2 className="w-3 h-3"/>Auto-saved</span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Completion strip */}
          {isDone(mod._id)&&tab==='content'&&(
            <div className="px-5 py-3 bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-800 flex items-center justify-between">
              <span className="text-sm font-bold text-green-700 dark:text-green-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/>Module Complete</span>
              {modIdx<mods.length-1
                ? <button onClick={()=>setModIdx(i=>i+1)} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-green-700 transition">Next Module →</button>
                : allDone&&course.exam?.length>0
                  ? <button onClick={()=>setShowExam(true)} className="bg-amber-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-amber-600 transition flex items-center gap-1.5"><GraduationCap className="w-4 h-4"/>Take Exam →</button>
                  : <span className="text-sm font-bold text-green-700 dark:text-green-400">🎓 All complete!</span>
              }
            </div>
          )}

          {/* Navigation */}
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <button onClick={()=>setModIdx(i=>Math.max(0,i-1))} disabled={modIdx===0} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-white dark:hover:bg-gray-700 transition bg-white dark:bg-gray-800">
              <ChevronLeft className="w-4 h-4"/>Prev
            </button>
            <span className="text-xs text-gray-400 font-semibold">{modIdx+1} / {mods.length}</span>
            <button onClick={()=>setModIdx(i=>Math.min(mods.length-1,i+1))} disabled={modIdx===mods.length-1} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-xl text-sm font-bold disabled:opacity-30 hover:bg-blue-700 transition">
              Next<ChevronRight className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </div>

      {/* AI floating chat — scoped to this course */}
      <AIMentorPanel courseId={course._id}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COURSE GRID
// ─────────────────────────────────────────────────────────────────────────────
function CourseCard({ course, prog, onSelect, i }) {
  const p        = prog?.progress||0;
  const lm       = LVL[course.level]||LVL.beginner;
  const nM       = course.modules?.length||0;
  const cert     = prog?.certificationEarned;
  const examCount = course.examCount || course.exam?.length || 0;
  const hasExam   = examCount > 0;
  const examReady = p === 100 && hasExam && !(prog?.bestExamScore >= (course.passingScore||70));

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*.04,duration:.25}}
      onClick={()=>onSelect(course)} role="button" tabIndex={0} onKeyDown={e=>e.key==='Enter'&&onSelect(course)}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 flex flex-col hover:-translate-y-0.5 relative overflow-hidden">

      {/* "Take Exam" ribbon — very visible when all modules done */}
      {examReady && (
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-amber-500 text-white text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md animate-pulse">
            <GraduationCap className="w-3 h-3"/>Take Exam!
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${lm.cls}`}>{lm.label}</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{course.assetco}</span>
        {course.required&&<span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1"><Lock className="w-2.5 h-2.5"/>Required</span>}
        {cert&&<span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 flex items-center gap-1"><Award className="w-2.5 h-2.5"/>Certified</span>}
      </div>

      <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-sm leading-snug mb-2 line-clamp-2">{course.title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3 line-clamp-2 flex-1">{course.description}</p>

      <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500 mb-3">
        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3"/>{nM} module{nM!==1?'s':''}</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>~{Math.ceil(nM*2)}h</span>
        {hasExam&&<span className="flex items-center gap-1"><GraduationCap className="w-3 h-3"/>{examCount}Q exam</span>}
      </div>

      <div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
          <div className={`h-full rounded-full transition-all duration-500 ${p===100?'bg-green-500':'bg-blue-600'}`} style={{width:`${p}%`}}/>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className={`font-bold ${p===100?'text-green-600 dark:text-green-400':'text-blue-600 dark:text-blue-400'}`}>{p}% complete</span>
          {p===100?<span className="text-green-600 dark:text-green-400 font-bold">Done ✓</span>:p>0?<span className="text-blue-500 font-semibold">Continue →</span>:<span className="text-gray-400">Start ▶</span>}
        </div>
      </div>

      {/* Bottom action row — explicit CTAs */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 flex-wrap">
          {hasExam && (
            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
              prog?.bestExamScore>=(course.passingScore||70)
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : p===100
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500 animate-pulse'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              <GraduationCap className="w-3 h-3"/>
              {prog?.bestExamScore>=(course.passingScore||70)?'Exam passed':'Final exam'}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs font-semibold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
            <Bot className="w-3 h-3"/>AI help
          </span>
          <span className="ml-auto text-xs font-bold text-gray-400">
            {p===100 ? '→ Take exam' : p>0 ? '→ Continue' : '→ Start'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function CourseGrid({ courses, progressMap, loading, onSelect }) {
  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({length:6}).map((_,i)=>(
        <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"/>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mb-2"/>
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-2/3 mb-4"/>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"/>
        </div>
      ))}
    </div>
  );
  if (!courses.length) return (
    <div className="text-center py-16 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
      <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3"/>
      <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-1">No courses found</h3>
      <p className="text-sm text-gray-400">Try different keywords or clear your filters.</p>
    </div>
  );
  const order=['beginner','intermediate','expert'];
  const groups={};
  courses.forEach(c=>{if(!groups[c.level])groups[c.level]=[];groups[c.level].push(c);});
  return (
    <>
      {order.filter(l=>groups[l]?.length).map(level=>(
        <div key={level} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-2.5 h-2.5 rounded-full ${LVL[level].dot}`}/>
            <h2 className="text-base font-extrabold text-gray-800 dark:text-gray-200">{LVL[level].label} Training</h2>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-2.5 py-0.5">{groups[level].length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups[level].map((c,i)=><CourseCard key={c._id} course={c} prog={progressMap[String(c._id)]} onSelect={onSelect} i={i}/>)}
          </div>
        </div>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEARNING PATH SIDEBAR (catalog view)
// ─────────────────────────────────────────────────────────────────────────────
function LearningSidebar({ courses, progressMap, stats, onSelect }) {
  const overall   = stats?.overallProgress || 0;
  const certCount = Object.values(progressMap).filter(p=>p.certificationEarned).length;
  const required  = courses.filter(c=>c.required);
  const reqDone   = required.filter(c=>(progressMap[String(c._id)]?.progress||0)===100).length;

  const badges = [
    { id:'starter',  label:'Starter',  earned: Object.keys(progressMap).length>0,             color:'text-gray-500',  bg:'bg-gray-100 dark:bg-gray-700'  },
    { id:'bronze',   label:'Bronze',   earned: overall>=25,                                    color:'text-amber-700', bg:'bg-amber-100 dark:bg-amber-900/30' },
    { id:'silver',   label:'Silver',   earned: overall>=50,                                    color:'text-gray-500',  bg:'bg-gray-100 dark:bg-gray-700'  },
    { id:'gold',     label:'Gold',     earned: overall>=75,                                    color:'text-yellow-600',bg:'bg-yellow-100 dark:bg-yellow-900/30'},
    { id:'platinum', label:'Platinum', earned: overall===100,                                  color:'text-blue-600',  bg:'bg-blue-100 dark:bg-blue-900/30'},
    { id:'scholar',  label:'Scholar',  earned: certCount>0,                                    color:'text-purple-600',bg:'bg-purple-100 dark:bg-purple-900/30'},
  ];

  return (
    <div className="space-y-4">
      {/* Progress ring card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5"/>My Progress</p>
        <div className="flex items-center gap-4">
          {/* Ring */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-gray-100 dark:text-gray-700" strokeWidth="3"/>
              <circle cx="18" cy="18" r="14" fill="none" stroke={overall===100?'#16a34a':'#2563eb'} strokeWidth="3"
                strokeDasharray={`${overall*0.879} 87.9`} strokeLinecap="round" style={{transition:'stroke-dasharray .6s ease'}}/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-blue-600 dark:text-blue-400">{overall}%</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm"><span className="font-black text-green-600 dark:text-green-400">{stats?.completedCourses||0}</span><span className="text-gray-500 text-xs">completed</span></div>
            <div className="flex items-center gap-2 text-sm"><span className="font-black text-amber-500">{certCount}</span><span className="text-gray-500 text-xs">certificates</span></div>
            {required.length>0&&<div className="flex items-center gap-2 text-sm"><span className={`font-black ${reqDone===required.length?'text-green-600':'text-red-500'}`}>{reqDone}/{required.length}</span><span className="text-gray-500 text-xs">required done</span></div>}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5"><Star className="w-3.5 h-3.5"/>Achievements</p>
        <div className="grid grid-cols-3 gap-2">
          {badges.map(b=>(
            <div key={b.id} title={b.earned?`Earned: ${b.label}`:`${b.label} — not yet earned`}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all ${b.earned?b.bg:'bg-gray-50 dark:bg-gray-700/30 opacity-40'}`}>
              <Award className={`w-5 h-5 ${b.earned?b.color:'text-gray-400'}`}/>
              <span className={`text-xs font-bold ${b.earned?b.color:'text-gray-400'}`}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* What you can do */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
        <p className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-1.5"><Info className="w-3.5 h-3.5"/>What You Can Do</p>
        <div className="space-y-2.5">
          {[
            { icon:'📖', title:'Study Modules',    desc:'Read lessons, watch videos, review key terms' },
            { icon:'✅', title:'Take Module Quizzes', desc:'Test knowledge after each module' },
            { icon:'🎓', title:'Final Exam',        desc:'Full exam after completing all modules — earn a certificate' },
            { icon:'🤖', title:'Ask AI Mentor',     desc:'Chat with AI for explanations and practice (blue button →)' },
            { icon:'📊', title:'Track Progress',    desc:'See completion % and achievement badges' },
          ].map((item,i)=>(
            <div key={i} className="flex gap-2.5">
              <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{item.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Course completion list */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wide mb-3">Course Breakdown</p>
        <div className="space-y-2.5 max-h-48 overflow-y-auto">
          {courses.slice(0,8).map(c=>{
            const p=progressMap[String(c._id)];
            const pct=p?.progress||0;
            return (
              <button key={c._id} onClick={()=>onSelect(c)} className="w-full text-left">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate pr-2">{c.title}</p>
                  <span className={`text-xs font-bold flex-shrink-0 ${pct===100?'text-green-600':'text-blue-600 dark:text-blue-400'}`}>{pct}%</span>
                </div>
                <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${pct===100?'bg-green-500':'bg-blue-600'}`} style={{width:`${pct}%`,transition:'width .5s ease'}}/>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: Training
// ─────────────────────────────────────────────────────────────────────────────
const Training = () => {
  const { user, onLogout } = useOutletContext();

  const [courses,      setCourses]      = useState([]);
  const [progress,     setProgress]     = useState([]);
  const [stats,        setStats]        = useState(null);
  const [activeCourse, setActiveCourse] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [selLevels,    setSelLevels]    = useState([]);
  const [selAssets,    setSelAssets]    = useState([]);
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [activeTab,    setActiveTab]    = useState('all');
  const [showGuide,    setShowGuide]    = useState(() => !localStorage.getItem('lms-guide-dismissed'));
  const filterRef = useRef(null);

  useEffect(()=>{
    const h=e=>{if(filterRef.current&&!filterRef.current.contains(e.target))setFilterOpen(false);};
    document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);
  },[]);

  useEffect(()=>{ fetchProgress(); fetchStats(); },[]);

  const fetchCourses=useCallback(debounce(async(f)=>{
    setLoading(true);
    try {
      const p=new URLSearchParams();
      if(f.level)p.append('level',f.level);
      if(f.assetco)p.append('assetco',f.assetco);
      if(f.search)p.append('search',f.search);
      const r=await axios.get(`${API}/api/learning/courses?${p}`,hdrs());
      setCourses(r.data.courses||[]);
    } catch { toast.error('Failed to load courses'); }
    finally { setLoading(false); }
  },300),[]);

  useEffect(()=>{
    fetchCourses({level:selLevels.join(','),assetco:selAssets.join(','),search:searchTerm});
  },[selLevels,selAssets,searchTerm]);

  const fetchProgress=async()=>{ try{const r=await axios.get(`${API}/api/learning/progress`,hdrs());setProgress(r.data.progress||[]);}catch{} };
  const fetchStats   =async()=>{ try{const r=await axios.get(`${API}/api/learning/stats`,hdrs());setStats(r.data.stats||null);}catch{} };

  const handleSelect=c=>{ setActiveCourse({_id:c._id,title:c.title}); window.scrollTo({top:0,behavior:'smooth'}); };
  const handleBack  =()=>{ setActiveCourse(null); fetchProgress(); fetchStats(); };

  const toggleLevel=l=>setSelLevels(p=>p.includes(l)?p.filter(x=>x!==l):[...p,l]);
  const toggleAsset=a=>setSelAssets(p=>p.includes(a)?p.filter(x=>x!==a):[...p,a]);
  const clearAll   =()=>{ setSelLevels([]); setSelAssets([]); setSearchTerm(''); };
  const filterCount=selLevels.length+selAssets.length;

  const progressMap=progress.reduce((acc,p)=>{ acc[String(p.courseId?._id||p.courseId)]=p; return acc; },{});

  const tabCourses=courses.filter(c=>{
    const p=progressMap[String(c._id)];
    if(activeTab==='required')   return c.required;
    if(activeTab==='inprogress') return p&&p.progress>0&&p.progress<100;
    if(activeTab==='completed')  return p&&p.progress===100;
    return true;
  });

  // ── COURSE VIEWER ──────────────────────────────────────────────────────────
  if (activeCourse) return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.4}}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <Toaster position="top-right"/>
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb with helpful action buttons */}
        <div className="bg-white/95 dark:bg-gray-800/95 border border-blue-100/50 dark:border-gray-700/50 rounded-2xl shadow-sm mb-5 px-4 py-3 flex items-center gap-2">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-sm font-bold hover:opacity-75 transition flex-shrink-0">
            <BookOpen className="w-4 h-4"/>Training Hub
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"/>
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 truncate flex-1 min-w-0">{activeCourse.title}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
              <Bot className="w-3 h-3 text-blue-500"/>
              <span>AI chat below →</span>
            </span>
          </div>
        </div>
        <CourseViewer courseId={activeCourse._id} progress={progressMap[String(activeCourse._id)]||null} onBack={handleBack} onProgressUpdate={fetchProgress} user={user}/>
      </div>
    </motion.div>
  );

  // ── CATALOG ────────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.6,ease:'easeOut'}}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col font-sans">
      <Toaster position="top-right"/>
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div initial={{y:16,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:.5}}
          className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-blue-100/50 dark:border-gray-700/50 rounded-3xl shadow-lg overflow-hidden">

          {/* Header */}
          <header className="bg-blue-50/50 dark:bg-blue-900/30 border-b border-blue-200/50 dark:border-gray-700/50 px-4 sm:px-6 py-4 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400"/>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-indigo-900 dark:text-indigo-100 tracking-tight">Training</h1>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">FundCo Capital Managers · Staff Training Portal</p>
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr,280px] gap-6">
              {/* ── LEFT: Main content ── */}
              <div className="space-y-5 min-w-0">
                {/* ── ONBOARDING: How to use the Training Hub ── */}
                <AnimatePresence>
                  {showGuide && (
                    <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8,scale:.98}}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10" style={{backgroundImage:'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',backgroundSize:'16px 16px'}}/>
                      <div className="relative">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-black text-base mb-3 flex items-center gap-2">
                              <GraduationCap className="w-5 h-5"/> Welcome to the Training Hub
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                              {[
                                {icon:'📖',text:'Click any course card to start learning'},
                                {icon:'✅',text:'Complete modules and take quizzes after each'},
                                {icon:'🎓',text:'Finish all modules → unlock the Final Exam'},
                                {icon:'🤖',text:'Blue chat button (bottom-right) = AI Mentor'},
                                {icon:'🏅',text:'Pass the exam → earn a certificate'},
                                {icon:'📓',text:'Use the Notes tab to save your thoughts per module'},
                              ].map((item,i)=>(
                                <div key={i} className="flex items-center gap-2 text-sm text-blue-100">
                                  <span className="text-base">{item.icon}</span><span>{item.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={()=>{ setShowGuide(false); localStorage.setItem('lms-guide-dismissed','1'); }}
                            className="text-white/60 hover:text-white flex-shrink-0 transition p-1 rounded-lg hover:bg-white/10"
                            title="Dismiss guide">
                            <X className="w-5 h-5"/>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {n:stats?.totalCourses??courses.length, l:'Enrolled',   c:'text-blue-700 dark:text-blue-300',   bg:'bg-blue-50 dark:bg-blue-900/20',   icon:BookOpen},
                    {n:stats?.completedCourses??0,          l:'Completed',  c:'text-green-700 dark:text-green-400', bg:'bg-green-50 dark:bg-green-900/20', icon:CheckCircle2},
                    {n:stats?.overallProgress!=null?`${stats.overallProgress}%`:'–', l:'Progress', c:'text-amber-600 dark:text-amber-400', bg:'bg-amber-50 dark:bg-amber-900/20', icon:TrendingUp},
                    {n:progress.filter(p=>p.certificationEarned).length, l:'Certificates', c:'text-purple-700 dark:text-purple-400', bg:'bg-purple-50 dark:bg-purple-900/20', icon:Award},
                  ].map((s,i)=>(
                    <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.08*i}}
                      className={`${s.bg} border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 shadow-sm flex items-center gap-3`}>
                      <s.icon className={`w-5 h-5 ${s.c} flex-shrink-0`}/>
                      <div><p className={`text-xl font-black ${s.c} leading-none`}>{s.n}</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.l}</p></div>
                    </motion.div>
                  ))}
                </div>

                {/* Search + filter */}
                <div className="bg-white/80 dark:bg-gray-700/50 border border-blue-200/50 dark:border-gray-600/50 rounded-xl p-3 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 flex items-center">
                    <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none"/>
                    <input className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition placeholder-gray-400"
                      placeholder="Search courses, topics, departments…"
                      value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
                    {searchTerm&&<button onClick={()=>setSearchTerm('')} className="absolute right-3 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5"/></button>}
                  </div>
                  <div ref={filterRef} className="relative">
                    <button onClick={()=>setFilterOpen(v=>!v)}
                      className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-semibold transition whitespace-nowrap ${filterCount>0?'bg-blue-600 border-blue-600 text-white':'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400'}`}>
                      <Filter className="w-4 h-4"/>Filters
                      {filterCount>0&&<span className="bg-white/25 rounded-full w-5 h-5 flex items-center justify-center text-xs font-black">{filterCount}</span>}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filterOpen?'rotate-180':''}`}/>
                    </button>
                    <AnimatePresence>
                      {filterOpen&&(
                        <motion.div initial={{opacity:0,y:-4,scale:.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-4,scale:.97}} transition={{duration:.13}}
                          className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 min-w-[220px]">
                          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wide mb-2">Level</p>
                          {LEVELS.map(l=>(
                            <label key={l} className="flex items-center gap-2 py-1.5 px-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                              <input type="checkbox" checked={selLevels.includes(l)} onChange={()=>toggleLevel(l)} className="accent-blue-600"/>
                              <span className={`w-2 h-2 rounded-full ${LVL[l].dot}`}/>{l.charAt(0).toUpperCase()+l.slice(1)}
                            </label>
                          ))}
                          <div className="h-px bg-gray-100 dark:bg-gray-700 my-2"/>
                          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wide mb-2">Department</p>
                          {ASSETCOS.map(a=>(
                            <label key={a} className="flex items-center gap-2 py-1.5 px-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                              <input type="checkbox" checked={selAssets.includes(a)} onChange={()=>toggleAsset(a)} className="accent-blue-600"/>{a}
                            </label>
                          ))}
                          {filterCount>0&&<button onClick={clearAll} className="w-full mt-2 text-xs text-red-500 hover:text-red-700 py-1.5 border border-red-200 dark:border-red-800 rounded-lg transition hover:bg-red-50 dark:hover:bg-red-900/20">Clear all filters</button>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-blue-200/50 dark:border-gray-700/50 overflow-x-auto">
                  {[
                    {id:'all',        label:'All Courses',  n:courses.length},
                    {id:'required',   label:'Required',     n:courses.filter(c=>c.required).length},
                    {id:'inprogress', label:'In Progress',  n:courses.filter(c=>{const p=progressMap[String(c._id)];return p&&p.progress>0&&p.progress<100;}).length},
                    {id:'completed',  label:'Completed',    n:courses.filter(c=>progressMap[String(c._id)]?.progress===100).length},
                  ].map(t=>(
                    <button key={t.id} onClick={()=>setActiveTab(t.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap -mb-px ${activeTab===t.id?'border-blue-600 text-blue-700 dark:text-blue-400 dark:border-blue-400':'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                      {t.label}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab===t.id?'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400':'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>{t.n}</span>
                    </button>
                  ))}
                </div>

                <CourseGrid courses={tabCourses} progressMap={progressMap} loading={loading} onSelect={handleSelect}/>
              </div>

              {/* ── RIGHT: Sidebar ── */}
              <aside className="hidden xl:block">
                <div className="sticky top-4">
                  <LearningSidebar courses={courses} progressMap={progressMap} stats={stats} onSelect={handleSelect}/>
                </div>
              </aside>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating AI chat — always visible on catalog */}
      <AIMentorPanel/>
    </motion.div>
  );
};

export default Training;