// src/pages/Training.jsx
// Fits inside Layout.jsx exactly like Dashboard.jsx and CalendarView.jsx
// No own dark mode, no own hero, no own sidebar — uses the app's existing layout
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';
import {
  BookOpen, Search, Filter, ChevronDown, Award, Clock, CheckCircle2,
  BarChart2, Lock, Star, Play, RotateCcw, Flag, ChevronLeft, ChevronRight,
  AlertCircle, X, Target, List, FileText
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const hdrs = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

// ── Level / AssetCo config ───────────────────────────────────────────────────
const LEVELS = ['beginner','intermediate','expert'];
const ASSETCOS = ['General','EML','GroSolar','Agronomie','SSM'];
const LVL = {
  beginner:     { label:'Beginner',     cls:'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',   dot:'bg-green-500' },
  intermediate: { label:'Intermediate', cls:'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',   dot:'bg-amber-500' },
  expert:       { label:'Expert',       cls:'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400', dot:'bg-purple-500' },
};

// ── Safe content renderer ────────────────────────────────────────────────────
function renderContent(raw) {
  const text = (raw != null ? String(raw) : '').trim();
  if (!text) return <p className="text-gray-400 italic text-sm">No content available for this module.</p>;
  return text.split('\n').map((line, i) => {
    const t = line.trim();
    if (!t) return <div key={i} className="h-2" />;
    if (/^[A-Z0-9 &()/:–\-·]{5,65}$/.test(t) && t === t.toUpperCase() && t.length < 65) {
      return <h3 key={i} className="text-xs font-extrabold tracking-widest text-blue-600 dark:text-blue-400 uppercase mt-6 mb-2 border-b border-blue-100 dark:border-blue-900/50 pb-1">{t}</h3>;
    }
    if (/^[●•·▪▸✓✗\-–]\s/.test(t) || /^\d+[.):]\s/.test(t)) {
      const c = t.replace(/^[●•·▪▸✓✗\-–]\s|^\d+[.):]\s/, '');
      return <div key={i} className="flex gap-2 my-1"><span className="text-blue-500 flex-shrink-0 mt-1 text-xs">›</span><span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{c}</span></div>;
    }
    return <p key={i} className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed mb-2">{t}</p>;
  });
}

// ── Quiz ─────────────────────────────────────────────────────────────────────
function QuizComponent({ quiz, moduleTitle, previousScore, onComplete }) {
  const [phase, setPhase] = useState('intro');
  const [cur, setCur] = useState(0);
  const [sel, setSel] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(null);

  if (!Array.isArray(quiz) || !quiz.length) return (
    <p className="text-center text-gray-400 py-8 text-sm">No quiz questions for this module.</p>
  );

  const q = quiz[cur];
  const next = () => {
    const a = [...answers, { q: q?.question||'', sel, correct: q?.answer||'', ok: sel===q?.answer, expl: q?.explanation||'' }];
    setAnswers(a);
    if (cur + 1 < quiz.length) { setCur(c=>c+1); setSel(null); setConfirmed(false); }
    else { const pct = Math.round((a.filter(x=>x.ok).length/quiz.length)*100); setScore(pct); setPhase('review'); }
  };
  const reset = () => { setCur(0); setSel(null); setConfirmed(false); setAnswers([]); setScore(null); setPhase('taking'); };

  if (phase === 'intro') return (
    <div className="text-center py-8">
      <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
        <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Module Quiz</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{moduleTitle}</p>
      <div className="flex justify-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <span>{quiz.length} questions</span>
        {previousScore != null && <span>Best: <strong className={previousScore>=70?'text-green-600':'text-red-500'}>{previousScore}%</strong></span>}
      </div>
      <button onClick={()=>setPhase('taking')} className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition">
        Start Quiz →
      </button>
    </div>
  );

  if (phase === 'done') return (
    <div className="text-center py-8">
      <div className="text-5xl mb-3">{score>=70?'🎉':'📚'}</div>
      <div className={`text-4xl font-black mb-2 ${score>=70?'text-green-600 dark:text-green-400':'text-amber-500'}`}>{score}%</div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{answers.filter(a=>a.ok).length}/{quiz.length} correct</p>
      <button onClick={reset} className="text-sm border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">↺ Try Again</button>
    </div>
  );

  if (phase === 'review') return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div><h3 className="font-bold text-gray-900 dark:text-gray-100">Results</h3><p className="text-sm text-gray-500">{answers.filter(a=>a.ok).length}/{quiz.length} correct</p></div>
        <div className={`text-3xl font-black ${score>=70?'text-green-600':'text-amber-500'}`}>{score}%</div>
      </div>
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
        {answers.map((a,i)=>(
          <div key={i} className={`p-3 rounded-lg border text-sm ${a.ok?'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800':'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
            <div className="flex gap-2 font-medium text-gray-800 dark:text-gray-200 mb-1"><span>{a.ok?'✅':'❌'}</span><span>{a.q}</span></div>
            {!a.ok && <div className="pl-6 text-xs space-y-0.5"><div className="text-red-600 dark:text-red-400">Your answer: {a.sel}</div><div className="text-green-600 dark:text-green-400">Correct: {a.correct}</div></div>}
            {a.expl && <p className="pl-6 mt-1 text-xs text-gray-500 dark:text-gray-400">💡 {a.expl}</p>}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={reset} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"><RotateCcw className="w-3.5 h-3.5"/>Retry</button>
        <button onClick={()=>{onComplete?.(score);setPhase('done');}} className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition">Continue →</button>
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
              if (confirmed) {
                if (opt===q.answer) cls='border-green-400 bg-green-50 dark:bg-green-900/30 dark:border-green-600';
                else if (opt===sel) cls='border-red-400 bg-red-50 dark:bg-red-900/30 dark:border-red-600';
              } else if (opt===sel) cls='border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500';
              return (
                <button key={i} disabled={confirmed} onClick={()=>setSel(opt)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left text-sm transition-all ${cls}`}>
                  <span className={`w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all ${opt===sel?'bg-blue-600 border-blue-600 text-white':confirmed&&opt===q.answer?'bg-green-500 border-green-500 text-white':'border-gray-300 dark:border-gray-500 text-gray-500'}`}>
                    {String.fromCharCode(65+i)}
                  </span>
                  <span className="flex-1 text-gray-700 dark:text-gray-200">{opt}</span>
                  {confirmed&&opt===q.answer&&<CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0"/>}
                  {confirmed&&opt===sel&&opt!==q.answer&&<X className="w-4 h-4 text-red-500 flex-shrink-0"/>}
                </button>
              );
            })}
          </div>
          {confirmed&&q.explanation&&(
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
              className={`p-3 rounded-lg text-sm mb-4 ${sel===q.answer?'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800':'bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'}`}>
              <span className="font-semibold">{sel===q.answer?'✅ Correct! ':'❌ Not quite — '}</span>
              <span className="text-gray-600 dark:text-gray-300">{q.explanation}</span>
            </motion.div>
          )}
          <div className="flex justify-end">
            {!confirmed
              ? <button onClick={()=>setConfirmed(true)} disabled={!sel} className="bg-blue-600 dark:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition">Check Answer</button>
              : <button onClick={next} className="bg-green-600 dark:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition">{cur+1<quiz.length?'Next →':'See Results'}</button>
            }
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Full Exam ─────────────────────────────────────────────────────────────────
function ExamView({ course, onBack, onComplete }) {
  const [phase, setPhase] = useState('loading');
  const [questions, setQuestions] = useState([]);
  const [passing, setPassing] = useState(70);
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [flagged, setFlagged] = useState(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [reviewIdx, setReviewIdx] = useState(0);
  const timer = useRef(null);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  useEffect(()=>{
    axios.get(`${API}/api/learning/exam/${course._id}`, hdrs())
      .then(r=>{ setQuestions(r.data.questions||[]); setAnswers(new Array((r.data.questions||[]).length).fill(null)); setPassing(r.data.passingScore||70); setPhase('intro'); })
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

  const q = questions[cur];
  const answered = answers.filter(a=>a!==null).length;

  if (phase==='loading'||phase==='grading') return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>
      <p className="text-sm text-gray-500">{phase==='loading'?'Loading exam…':'Grading…'}</p>
    </div>
  );

  if (phase==='intro') return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <Award className="w-8 h-8 text-amber-500"/>
      </div>
      <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-1">Course Exam</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{course.title}</p>
      <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-6">
        {[{n:questions.length,l:'Questions'},{n:`${passing}%`,l:'Pass Mark'},{n:'No limit',l:'Time'}].map(s=>(
          <div key={s.l} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
            <div className="text-xl font-black text-blue-600 dark:text-blue-400">{s.n}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 text-left max-w-sm mx-auto mb-6 space-y-2">
        {['Select one answer per question','Flag questions to review later','Submit when ready — full review shown'].map((r,i)=>(
          <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0"/>{r}
          </div>
        ))}
      </div>
      <button onClick={()=>{setPhase('taking');startTimer();}} className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-bold text-base transition">
        Begin Exam →
      </button>
    </div>
  );

  if (phase==='result'&&result) {
    const {score,passed,correct,total,answers:graded,questions:qs}=result;
    const rq=qs?.[reviewIdx]||{};const ra=graded?.[reviewIdx]||{};
    return (
      <div className="space-y-5">
        {/* Banner */}
        <div className={`rounded-2xl p-5 flex items-center gap-4 ${passed?'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800':'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
          <div className="text-4xl">{passed?'🎓':'📚'}</div>
          <div className="flex-1">
            <div className="font-black text-lg text-gray-900 dark:text-gray-100">{passed?'You Passed!':'Keep Studying!'}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{correct}/{total} correct · {fmt(elapsed)}</div>
          </div>
          <div className={`text-4xl font-black ${passed?'text-green-600':'text-red-500'}`}>{score}%</div>
        </div>
        {/* Q Review nav */}
        {qs?.length>0&&(
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3 text-sm">Question Review</h3>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {graded.map((a,i)=>(
                <button key={i} onClick={()=>setReviewIdx(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold border transition ${a.correct?'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400':'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400'}${i===reviewIdx?' ring-2 ring-blue-400 ring-offset-1':''}`}>
                  {i+1}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={reviewIdx} initial={{opacity:0,x:6}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-6}} transition={{duration:.14}}>
                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-3">Q{reviewIdx+1}. {rq.question}</p>
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
                  <button onClick={()=>setReviewIdx(i=>Math.max(0,i-1))} disabled={reviewIdx===0} className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition">← Prev</button>
                  <button onClick={()=>setReviewIdx(i=>Math.min(total-1,i+1))} disabled={reviewIdx===total-1} className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition">Next →</button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={()=>{setAnswers(new Array(questions.length).fill(null));setFlagged(new Set());setCur(0);setElapsed(0);setResult(null);setPhase('intro');}} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <RotateCcw className="w-4 h-4"/> Retake
          </button>
          <button onClick={()=>onComplete?.(score)} className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            {passed?'🎓 Claim Certificate':'Back to Course'}
          </button>
        </div>
      </div>
    );
  }

  if (!q) return null;
  return (
    <div>
      {/* Exam top bar */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">Q {cur+1}/{questions.length}</span>
          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{width:`${(answered/questions.length)*100}%`}}/>
          </div>
          <span className="text-xs text-gray-400">{answered} answered</span>
        </div>
        <div className="flex items-center gap-1.5 ml-4 text-sm font-bold text-gray-700 dark:text-gray-300 flex-shrink-0">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400"/>{fmt(elapsed)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[160px,1fr] gap-4">
        {/* Q Grid navigator */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Questions</p>
          <div className="grid grid-cols-5 lg:grid-cols-4 gap-1">
            {questions.map((_,i)=>(
              <button key={i} onClick={()=>setCur(i)}
                className={`aspect-square rounded-lg text-xs font-bold border transition ${
                  i===cur?'bg-blue-600 border-blue-600 text-white ring-2 ring-blue-300 ring-offset-1':
                  answers[i]?'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400':
                  flagged.has(i)?'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700':
                  'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-700/30 dark:border-gray-600'
                }`}>
                {i+1}
              </button>
            ))}
          </div>
        </div>

        {/* Question area */}
        <div>
          <AnimatePresence mode="wait">
            <motion.div key={cur} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:.15}}>
              <p className="font-bold text-gray-900 dark:text-gray-100 text-base leading-snug mb-5">{q.question}</p>
              <div className="space-y-2.5 mb-5">
                {(q.options||[]).map((opt,i)=>(
                  <button key={i} onClick={()=>{const a=[...answers];a[cur]=opt;setAnswers(a);}}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all ${
                      answers[cur]===opt?'border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500':'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/30 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                    }`}>
                    <span className={`w-7 h-7 rounded-full border flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all ${answers[cur]===opt?'bg-blue-600 border-blue-600 text-white':'border-gray-300 dark:border-gray-500 text-gray-400'}`}>
                      {String.fromCharCode(65+i)}
                    </span>
                    <span className="flex-1 text-gray-700 dark:text-gray-200">{opt}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={()=>setCur(i=>Math.max(0,i-1))} disabled={cur===0} className="flex items-center gap-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <ChevronLeft className="w-4 h-4"/> Prev
                </button>
                <button onClick={()=>setFlagged(f=>{const n=new Set(f);n.has(cur)?n.delete(cur):n.add(cur);return n;})}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm border transition ${flagged.has(cur)?'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/20 dark:border-amber-600':'border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <Flag className="w-3.5 h-3.5"/> {flagged.has(cur)?'Unflag':'Flag'}
                </button>
                {cur<questions.length-1
                  ? <button onClick={()=>setCur(i=>i+1)} className="ml-auto flex items-center gap-1 px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">Next <ChevronRight className="w-4 h-4"/></button>
                  : <button onClick={()=>{if(answered<questions.length&&!window.confirm(`${questions.length-answered} unanswered. Submit?`))return;submit();}} className="ml-auto px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition">Submit ✓</button>
                }
              </div>

              {answered===questions.length&&(
                <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
                  className="flex items-center justify-between mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4"/> All answered!
                  </span>
                  <button onClick={submit} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition">Submit →</button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Course Viewer ─────────────────────────────────────────────────────────────
function CourseViewer({ courseId, progress, onBack, onProgressUpdate }) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modIdx, setModIdx] = useState(0);
  const [tab, setTab] = useState('content');
  const [showExam, setShowExam] = useState(false);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [modProgress, setModProgress] = useState([]);
  const [courseProgress, setCourseProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    let cancelled=false;
    setLoading(true); setError(false);
    axios.get(`${API}/api/learning/courses/${courseId}`, hdrs())
      .then(r=>{
        if(cancelled)return;
        const c=r.data.course;
        if(!c){setError(true);return;}
        c.modules=(c.modules||[]).map(m=>({...m,content:m.content!=null?String(m.content):'',title:m.title!=null?String(m.title):'Untitled',quiz:Array.isArray(m.quiz)?m.quiz:[],terms:Array.isArray(m.terms)?m.terms:[],objectives:Array.isArray(m.objectives)?m.objectives:[]}));
        setCourse(c);
      })
      .catch(()=>{if(!cancelled)setError(true);})
      .finally(()=>{if(!cancelled)setLoading(false);});
    return()=>{cancelled=true;};
  },[courseId]);

  useEffect(()=>{
    if(progress){setCompletedIds(new Set((progress.completedModules||[]).map(String)));setModProgress(progress.moduleProgress||[]);setCourseProgress(progress.progress||0);}
  },[progress]);

  useEffect(()=>{ setTab('content'); },[modIdx]);

  if(loading) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-9 h-9 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading course…</p>
    </div>
  );
  if(error||!course) return (
    <div className="text-center py-12">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3"/>
      <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Could not load this course.</p>
      <button onClick={onBack} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">← Go Back</button>
    </div>
  );

  const mods=course.modules||[];
  const mod=mods[modIdx];
  if(!mods.length||!mod) return (
    <div className="text-center py-12">
      <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">This course has no modules yet.</p>
      <button onClick={onBack} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">← Go Back</button>
    </div>
  );

  const isDone = id => completedIds.has(String(id));
  const modProg = modProgress.find(mp=>String(mp.moduleId)===String(mod._id));
  const allDone = mods.every(m=>isDone(m._id));
  const bestExam = progress?.bestExamScore||0;
  const examPassed = bestExam>=(course.passingScore||70);
  const lm = LVL[course.level]||LVL.beginner;

  const markComplete = async (quizScore=null)=>{
    if(!mod||saving)return;
    setSaving(true);
    try {
      const body={courseId:course._id,moduleId:mod._id};
      if(quizScore!=null)body.quizScore=quizScore;
      const r=await axios.post(`${API}/api/learning/module-progress`,body,hdrs());
      const u=r.data.progress;
      setCompletedIds(new Set((u.completedModules||[]).map(String)));
      setModProgress(u.moduleProgress||[]);
      setCourseProgress(u.progress||0);
      onProgressUpdate?.();
      toast.success('Progress saved!');
      if(quizScore==null&&modIdx<mods.length-1)setTimeout(()=>setModIdx(i=>i+1),600);
    } catch { toast.error('Failed to save progress'); }
    finally { setSaving(false); }
  };

  const tabs=[
    {id:'content',label:'Lesson',show:true},
    {id:'video',label:'Video',show:!!mod.videoUrl},
    {id:'terms',label:'Key Terms',show:!!(mod.terms?.length)},
    {id:'quiz',label:'Quiz',show:!!(mod.quiz?.length)},
  ].filter(t=>t.show);

  const embedUrl=url=>{
    if(!url)return null;
    if(url.includes('playlist?list=')){const id=url.split('list=')[1]?.split('&')[0];return`https://www.youtube.com/embed/videoseries?list=${id}&rel=0&modestbranding=1`;}
    if(url.includes('watch?v=')){const id=url.split('v=')[1]?.split('&')[0];return`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;}
    return null;
  };

  if(showExam) return (
    <div>
      <button onClick={()=>setShowExam(false)} className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-5 hover:opacity-80 transition">
        <ChevronLeft className="w-4 h-4"/> Back to Course
      </button>
      <ExamView course={course} onBack={()=>setShowExam(false)} onComplete={score=>{setShowExam(false);onProgressUpdate?.();score>=(course.passingScore||70)?toast.success(`🎓 Passed! ${score}%`,{duration:4000}):toast.error(`${score}% — Need ${course.passingScore||70}%`,{duration:4000});}}/>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px,1fr] gap-5">
      {/* Module sidebar */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm lg:sticky lg:top-4 lg:self-start">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Modules</span>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{completedIds.size}/{mods.length}</span>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {mods.map((m,i)=>{
            const done=isDone(m._id);const active=i===modIdx;
            return (
              <button key={m._id||i} onClick={()=>setModIdx(i)}
                className={`w-full flex items-start gap-2.5 px-3.5 py-3 border-b border-gray-100 dark:border-gray-700/50 text-left transition-all ${active?'bg-blue-50 dark:bg-blue-900/30':'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 text-xs font-bold ${done?'bg-green-500 text-white':active?'bg-blue-600 text-white':'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'}`}>
                  {done?<CheckCircle2 className="w-3 h-3"/>:i+1}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold leading-snug truncate ${active?'text-blue-700 dark:text-blue-300':done?'text-green-700 dark:text-green-400':'text-gray-700 dark:text-gray-300'}`}>{m.title||`Module ${i+1}`}</p>
                  {m.estimatedMinutes&&<p className="text-xs text-gray-400 mt-0.5">{m.estimatedMinutes}min</p>}
                </div>
              </button>
            );
          })}
        </div>
        {/* Exam block */}
        {course.exam?.length>0&&(
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-amber-500"/>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{examPassed?'Exam Passed ✓':'Final Exam'}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{course.exam.length}Q · {course.passingScore||70}% pass{bestExam>0?` · Best: ${bestExam}%`:''}</p>
            {!allDone&&<p className="text-xs text-amber-600 dark:text-amber-500 mb-2">⚠ Complete all modules first</p>}
            <button disabled={!allDone} onClick={()=>setShowExam(true)}
              className="w-full py-1.5 rounded-lg text-xs font-bold transition bg-amber-500 hover:bg-amber-600 text-white disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500">
              {examPassed?'Retake':allDone?'Start Exam →':'Locked 🔒'}
            </button>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
        {/* Module header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Module {modIdx+1} of {mods.length}</p>
              <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 leading-snug">{mod.title||`Module ${modIdx+1}`}</h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${lm.cls}`}>{lm.label}</span>
              {isDone(mod._id)&&<span className="text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/>Done</span>}
            </div>
          </div>
          {/* Overall progress bar */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{width:`${courseProgress}%`}}/>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{courseProgress}% done</span>
          </div>
          {/* Objectives */}
          {mod.objectives?.length>0&&(
            <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2">Objectives</p>
              {mod.objectives.map((o,i)=><div key={i} className="flex gap-2 text-xs text-gray-600 dark:text-gray-300 mb-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"/><span>{o}</span></div>)}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 overflow-x-auto">
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${tab===t.id?'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400':'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
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
                : <a href={mod.videoUrl} target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-3 p-10 bg-gray-50 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
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
              <QuizComponent quiz={mod.quiz} moduleTitle={mod.title} previousScore={modProg?.quizScore} onComplete={score=>markComplete(score)}/>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer: complete strip + navigation */}
        {isDone(mod._id)&&tab==='content'&&(
          <div className="px-5 py-3 bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-800 flex items-center justify-between">
            <span className="text-sm font-bold text-green-700 dark:text-green-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/>Module Complete</span>
            {modIdx<mods.length-1
              ? <button onClick={()=>setModIdx(i=>i+1)} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-green-700 transition">Next Module →</button>
              : allDone&&course.exam?.length>0
                ? <button onClick={()=>setShowExam(true)} className="bg-amber-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-amber-600 transition">Take Exam →</button>
                : <span className="text-sm font-bold text-green-700 dark:text-green-400">🎓 All complete!</span>
            }
          </div>
        )}
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <button onClick={()=>setModIdx(i=>Math.max(0,i-1))} disabled={modIdx===0} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-white dark:hover:bg-gray-700 transition bg-white dark:bg-gray-800">
            <ChevronLeft className="w-4 h-4"/> Prev
          </button>
          <span className="text-xs text-gray-400 font-semibold">{modIdx+1} / {mods.length}</span>
          <button onClick={()=>setModIdx(i=>Math.min(mods.length-1,i+1))} disabled={modIdx===mods.length-1} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-xl text-sm font-bold disabled:opacity-30 hover:bg-blue-700 transition">
            Next <ChevronRight className="w-4 h-4"/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Course Grid ────────────────────────────────────────────────────────────────
function CourseCard({ course, prog, onSelect, i }) {
  const p=prog?.progress||0;
  const lm=LVL[course.level]||LVL.beginner;
  const nMods=course.modules?.length||0;
  const cert=prog?.certificationEarned;
  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*.04,duration:.25}}
      onClick={()=>onSelect(course)} role="button" tabIndex={0} onKeyDown={e=>e.key==='Enter'&&onSelect(course)}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 flex flex-col hover:-translate-y-0.5">
      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${lm.cls}`}>{lm.label}</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{course.assetco}</span>
        {course.required&&<span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1"><Lock className="w-2.5 h-2.5"/>Required</span>}
      </div>
      {/* Title */}
      <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-sm leading-snug mb-2 line-clamp-2">{course.title}</h3>
      {/* Desc */}
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3 line-clamp-2 flex-1">{course.description}</p>
      {/* Meta */}
      <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500 mb-3">
        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3"/>{nMods} modules</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>~{Math.ceil(nMods*2)}h</span>
        {course.exam?.length>0&&<span className="flex items-center gap-1"><BarChart2 className="w-3 h-3"/>{course.exam.length}Q exam</span>}
      </div>
      {/* Progress */}
      <div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
          <div className={`h-full rounded-full transition-all duration-500 ${p===100?'bg-green-500':'bg-blue-600'}`} style={{width:`${p}%`}}/>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className={`font-bold ${p===100?'text-green-600 dark:text-green-400':'text-blue-600 dark:text-blue-400'}`}>{p}% complete</span>
          <span className="flex items-center gap-2">
            {cert&&<span className="text-amber-500 flex items-center gap-1 font-bold"><Award className="w-3 h-3"/>Cert</span>}
            {p===100?<span className="text-green-600 dark:text-green-400 font-bold">Done ✓</span>:p>0?<span className="text-blue-500 font-semibold">Continue →</span>:<span className="text-gray-400">Start ▶</span>}
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
      <p className="text-sm text-gray-400 dark:text-gray-500">Try different keywords or clear your filters.</p>
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

// ── Stat card ─────────────────────────────────────────────────────────────────
function Stat({ n, label, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 shadow-sm">
      <p className={`text-2xl font-black ${color} leading-none mb-0.5`}>{n}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

// ── Main Training Page ────────────────────────────────────────────────────────
const Training = () => {
  // Gets user/tasks from Layout.jsx outlet context — same as Dashboard
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
  const filterRef = useRef(null);

  useEffect(()=>{
    const h=e=>{if(filterRef.current&&!filterRef.current.contains(e.target))setFilterOpen(false);};
    document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);
  },[]);

  useEffect(()=>{ fetchProgress(); fetchStats(); },[]);

  const fetchCourses = useCallback(debounce(async(f)=>{
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

  const handleSelect = c=>{ setActiveCourse({_id:c._id,title:c.title}); window.scrollTo({top:0,behavior:'smooth'}); };
  const handleBack   = ()=>{ setActiveCourse(null); fetchProgress(); fetchStats(); };

  const toggleLevel = l=>setSelLevels(p=>p.includes(l)?p.filter(x=>x!==l):[...p,l]);
  const toggleAsset = a=>setSelAssets(p=>p.includes(a)?p.filter(x=>x!==a):[...p,a]);
  const clearAll    = ()=>{ setSelLevels([]); setSelAssets([]); setSearchTerm(''); };
  const filterCount = selLevels.length+selAssets.length;

  const progressMap = progress.reduce((acc,p)=>{ acc[String(p.courseId?._id||p.courseId)]=p; return acc; },{});

  const tabCourses = courses.filter(c=>{
    const p=progressMap[String(c._id)];
    if(activeTab==='required')   return c.required;
    if(activeTab==='inprogress') return p&&p.progress>0&&p.progress<100;
    if(activeTab==='completed')  return p&&p.progress===100;
    return true;
  });

  // ── COURSE VIEWER mode ────────────────────────────────────────────────────
  if (activeCourse) return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.4}}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col font-sans">
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Toaster position="top-right" toastOptions={{style:{background:'var(--tw-bg-opacity)',border:'1px solid #e5e7eb'}}}/>

        {/* Breadcrumb — matches app's nav style */}
        <div className="bg-white/95 dark:bg-gray-800/95 border border-blue-100/50 dark:border-gray-700/50 rounded-2xl shadow-sm mb-5 px-4 py-3 flex items-center gap-2">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-sm font-bold hover:opacity-80 transition">
            <BookOpen className="w-4 h-4"/>Training Hub
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400"/>
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 truncate">{activeCourse.title}</span>
        </div>

        <CourseViewer
          courseId={activeCourse._id}
          progress={progressMap[String(activeCourse._id)]||null}
          onBack={handleBack}
          onProgressUpdate={fetchProgress}
        />
      </div>
    </motion.div>
  );

  // ── CATALOG mode — matches Dashboard visual style ─────────────────────────
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.6,ease:'easeOut'}}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col font-sans">
      <Toaster position="top-right"/>
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div initial={{y:16,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:.5}}
          className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-blue-100/50 dark:border-gray-700/50 rounded-3xl shadow-lg flex flex-col overflow-hidden">

          {/* Header — mirrors Dashboard header exactly */}
          <header className="bg-blue-50/50 dark:bg-blue-900/30 border-b border-blue-200/50 dark:border-gray-700/50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400"/>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-indigo-900 dark:text-indigo-100 tracking-tight">Training Hub</h1>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">FundCo Capital Managers · Staff Learning Portal</p>
              </div>
            </div>
            <img
              src={user?.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName||user?.name||'User')}`}
              alt="Avatar"
              className="w-9 h-9 sm:w-10 h-10 rounded-full border-2 border-blue-400/50 dark:border-blue-800/50"/>
          </header>

          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8 space-y-5">

              {/* Stats row — matches Dashboard stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat n={stats?.totalCourses??courses.length} label="Enrolled"         color="text-blue-700 dark:text-blue-300"/>
                <Stat n={stats?.completedCourses??0}          label="Completed"         color="text-green-700 dark:text-green-400"/>
                <Stat n={stats?.overallProgress!=null?`${stats.overallProgress}%`:'–'}  label="Overall Progress" color="text-amber-600 dark:text-amber-400"/>
                <Stat n={progress.filter(p=>p.certificationEarned).length}             label="Certificates"      color="text-purple-700 dark:text-purple-400"/>
              </div>

              {/* Toolbar */}
              <div className="bg-white/80 dark:bg-gray-700/50 border border-blue-200/50 dark:border-gray-600/50 rounded-xl p-3 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 flex items-center">
                  <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none"/>
                  <input className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition placeholder-gray-400"
                    placeholder="Search courses, topics, departments…"
                    value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
                  {searchTerm&&<button onClick={()=>setSearchTerm('')} className="absolute right-3 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5"/></button>}
                </div>
                <div ref={filterRef} className="relative">
                  <button onClick={()=>setFilterOpen(v=>!v)}
                    className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-semibold transition whitespace-nowrap ${filterCount>0?'bg-blue-600 border-blue-600 text-white':'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400'}`}>
                    <Filter className="w-4 h-4"/>
                    Filters {filterCount>0&&<span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs font-black">{filterCount}</span>}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filterOpen?'rotate-180':''}`}/>
                  </button>
                  <AnimatePresence>
                    {filterOpen&&(
                      <motion.div initial={{opacity:0,y:-4,scale:.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-4,scale:.97}} transition={{duration:.13}}
                        className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 min-w-[220px]">
                        <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wide mb-2">Level</p>
                        {LEVELS.map(l=>(
                          <label key={l} className="flex items-center gap-2 py-1.5 px-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                            <input type="checkbox" checked={selLevels.includes(l)} onChange={()=>toggleLevel(l)} className="accent-blue-600"/><span className={`w-2 h-2 rounded-full ${LVL[l].dot}`}/>{l.charAt(0).toUpperCase()+l.slice(1)}
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

              {/* Tabs — mirrors Dashboard filter tabs */}
              <div className="flex gap-1 border-b border-blue-200/50 dark:border-gray-700/50">
                {[
                  {id:'all',       label:'All Courses', n:courses.length},
                  {id:'required',  label:'Required',    n:courses.filter(c=>c.required).length},
                  {id:'inprogress',label:'In Progress', n:courses.filter(c=>{const p=progressMap[String(c._id)];return p&&p.progress>0&&p.progress<100;}).length},
                  {id:'completed', label:'Completed',   n:courses.filter(c=>progressMap[String(c._id)]?.progress===100).length},
                ].map(t=>(
                  <button key={t.id} onClick={()=>setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap -mb-px ${activeTab===t.id?'border-blue-600 text-blue-700 dark:text-blue-400 dark:border-blue-400':'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                    {t.label}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab===t.id?'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400':'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>{t.n}</span>
                  </button>
                ))}
              </div>

              {/* Course grid */}
              <CourseGrid courses={tabCourses} progressMap={progressMap} loading={loading} onSelect={handleSelect}/>
            </div>
          </main>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Training;