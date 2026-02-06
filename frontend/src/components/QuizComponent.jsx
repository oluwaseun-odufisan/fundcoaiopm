// frontend/src/components/QuizComponent.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, RotateCcw, Clock, HelpCircle, Lightbulb, PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
const QuizComponent = ({ quiz, onComplete }) => {
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.length * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !showAnswers) {
      submitQuiz();
      toast.error('Time\'s up! Submitting your answers.');
    }
  }, [timeLeft, timerRunning, showAnswers]);
  const startQuiz = () => {
    setTimerRunning(true);
  };
  const handleAnswer = (qIndex, option) => {
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };
  const submitQuiz = () => {
    setTimerRunning(false);
    let correct = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });
    const percentage = (correct / quiz.length) * 100;
    setScore(percentage);
    setShowAnswers(true);
    if (percentage >= 80) {
      toast.success('Excellent! Module complete.', { duration: 3000 });
      onComplete();
    } else {
      toast.error(`Score: ${percentage.toFixed(1)}%. Review and retake.`, { duration: 3000 });
    }
  };
  const retakeQuiz = () => {
    setAnswers({});
    setScore(null);
    setShowAnswers(false);
    setTimeLeft(quiz.length * 60);
    setTimerRunning(false);
    setCurrentQuestion(0);
    setShowHints(false);
  };
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  const nextQuestion = () => {
    if (currentQuestion < quiz.length - 1) setCurrentQuestion(currentQuestion + 1);
  };
  const prevQuestion = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };
  if (!timerRunning) {
    return (
      <motion.div
        className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-inner"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <HelpCircle className="w-16 h-16 mx-auto mb-4 text-blue-300 dark:text-blue-500 animate-bounce" />
        <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-4">Ready for Assessment?</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">You have {quiz.length} questions. Time limit: {quiz.length} minutes. Hints available.</p>
        <button
          onClick={startQuiz}
          className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto shadow-md"
        >
          <PlayCircle className="w-5 h-5" /> Begin Assessment
        </button>
      </motion.div>
    );
  }
  return (
    <motion.div
      className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-xl mt-6 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      aria-label="Quiz Assessment"
    >
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow text-blue-800 dark:text-blue-300 font-medium flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
      </div>
      <button
        onClick={() => setShowHints(!showHints)}
        className="absolute top-4 left-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 text-sm"
      >
        <Lightbulb className="w-4 h-4" /> Hints {showHints ? 'On' : 'Off'}
      </button>
      <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-6 flex items-center gap-2">
        <HelpCircle className="w-5 h-5" /> Question {currentQuestion + 1} of {quiz.length}
      </h3>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-6">
            <p className="font-medium text-blue-900 dark:text-blue-300 text-lg mb-4">{quiz[currentQuestion].question}</p>
            {quiz[currentQuestion].options.map((opt, j) => (
              <motion.label
                key={j}
                className={`flex items-center p-4 rounded-lg cursor-pointer transition-all border ${
                  answers[currentQuestion] === opt
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                    : 'border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                }`}
                whileHover={{ scale: 1.02 }}
              >
                <input
                  type="radio"
                  name={`q${currentQuestion}`}
                  onChange={() => handleAnswer(currentQuestion, opt)}
                  checked={answers[currentQuestion] === opt}
                  className="mr-3 accent-blue-600 dark:accent-blue-400 w-5 h-5"
                />
                <span className="flex-1 text-gray-800 dark:text-gray-200">{opt}</span>
              </motion.label>
            ))}
            {showHints && quiz[currentQuestion].hint && (
              <motion.div
                className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-sm text-yellow-800 dark:text-yellow-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Lightbulb className="w-4 h-4 inline mr-1" /> Hint: {quiz[currentQuestion].hint}
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex justify-between mt-8 pt-4 border-t border-blue-100 dark:border-blue-900/50">
        <button
          onClick={prevQuestion}
          disabled={currentQuestion === 0}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:text-gray-400 dark:disabled:text-gray-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" /> Previous
        </button>
        {currentQuestion < quiz.length - 1 ? (
          <button
            onClick={nextQuestion}
            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Next <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        ) : (
          <button
            onClick={submitQuiz}
            disabled={Object.keys(answers).length < quiz.length}
            className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-60 transition-colors"
          >
            Submit Assessment
          </button>
        )}
      </div>
      {showAnswers && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow"
        >
          <h4 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-4 text-center">Assessment Results</h4>
          <p className={`text-4xl font-bold text-center mb-6 ${score >= 80 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{score.toFixed(1)}%</p>
          <div className="space-y-6">
            {quiz.map((q, i) => (
              <div key={i} className="space-y-3 border-b pb-4 last:border-0">
                <p className="font-medium text-blue-900 dark:text-blue-300">{q.question}</p>
                {q.options.map((opt, j) => (
                  <div
                    key={j}
                    className={`flex items-center p-3 rounded-lg ${
                      opt === q.answer
                        ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
                        : answers[i] === opt
                          ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'
                          : 'bg-gray-50 dark:bg-gray-700'
                    } border`}
                  >
                    <span className="flex-1 text-gray-800 dark:text-gray-200">{opt}</span>
                    {opt === q.answer && <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 ml-2" />}
                    {answers[i] === opt && opt !== q.answer && <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 ml-2" />}
                  </div>
                ))}
                {answers[i] !== q.answer && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1">
                    <Lightbulb className="w-4 h-4 text-yellow-500 dark:text-yellow-400" /> Explanation: {q.explanation || 'Review the module content for details.'}
                  </p>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={retakeQuiz}
            className="mt-6 w-full py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" /> Retake Assessment
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};
export default QuizComponent;