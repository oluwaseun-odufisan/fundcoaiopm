// utils/performanceCalculator.js
// SINGLE SOURCE OF TRUTH — pure, deterministic, fully tested math
// No side-effects, no DB calls, no dates (we use task.completed + submissionStatus only)

export const PRIORITY_WEIGHTS = {
  Low: 10,
  Medium: 25,
  High: 50,
};

export const GOAL_MAX_POINTS = 100; // 100 points per fully completed goal

/**
 * Task score = (priority weight) + approval bonus + checklist bonus
 * Approved tasks get +30
 * Checklist = 0-20 bonus based on % complete
 */
export const calculateTaskScore = (task) => {
  if (!task || !task.completed) return 0;

  const weight = PRIORITY_WEIGHTS[task.priority] || PRIORITY_WEIGHTS.Low;
  let score = weight;

  // Approval bonus
  if (task.submissionStatus === 'approved') {
    score += 30;
  }

  // Checklist bonus (0-20)
  if (task.checklist && task.checklist.length > 0) {
    const completedItems = task.checklist.filter(item => item.completed).length;
    const checklistRatio = completedItems / task.checklist.length;
    score += Math.round(checklistRatio * 20);
  }

  return Math.max(0, score);
};

/**
 * Goal score = progress % * 100 (max 100 per goal)
 */
export const calculateGoalScore = (goal) => {
  if (!goal || !goal.subGoals || goal.subGoals.length === 0) return 0;

  const completed = goal.subGoals.filter(sg => sg.completed).length;
  const progress = (completed / goal.subGoals.length) * 100;
  return Math.round(progress);
};

/**
 * Total performance score for a user (used for leaderboard + bonuses)
 */
export const calculateUserTotalScore = (tasks = [], goals = []) => {
  const taskPoints = tasks.reduce((sum, t) => sum + calculateTaskScore(t), 0);
  const goalPoints = goals.reduce((sum, g) => sum + calculateGoalScore(g), 0);
  return taskPoints + goalPoints;
};

/**
 * Completion rate % (tasks only — most visible KPI)
 */
export const calculateCompletionRate = (tasks = []) => {
  if (!tasks.length) return 0;
  const completed = tasks.filter(t => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
};

/**
 * Gamification levels (used everywhere — consistent with user.level field)
 */
export const getUserLevel = (totalScore) => {
  const tiers = [
    { name: 'Novice', min: 0 },
    { name: 'Apprentice', min: 300 },
    { name: 'Journeyman', min: 800 },
    { name: 'Expert', min: 1500 },
    { name: 'Master', min: 3000 },
    { name: 'Legend', min: 6000 },
  ];
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (totalScore >= tiers[i].min) return tiers[i].name;
  }
  return 'Novice';
};

/**
 * Bonus eligibility — pure logic (used by admin modal)
 * Returns { eligible: boolean, suggestedBonus: number, reason: string }
 */
export const getBonusEligibility = (totalScore, completionRate, currentPoints) => {
  const suggested = Math.floor(totalScore * 0.15); // 15% of score as bonus suggestion
  if (completionRate >= 90 && totalScore >= 1200) {
    return { eligible: true, suggestedBonus: Math.max(200, suggested), reason: 'Outstanding performance — 90%+ completion + high score' };
  }
  if (completionRate >= 75 && totalScore >= 800) {
    return { eligible: true, suggestedBonus: Math.max(100, suggested), reason: 'Strong performer' };
  }
  return { eligible: false, suggestedBonus: 0, reason: 'Keep going!' };
};

export default {
  PRIORITY_WEIGHTS,
  calculateTaskScore,
  calculateGoalScore,
  calculateUserTotalScore,
  calculateCompletionRate,
  getUserLevel,
  getBonusEligibility,
};