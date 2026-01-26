// backend/models/learningMaterialModel.js
import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  answer: { type: String, required: true },
});

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true }, // Full text content
  videoUrl: { type: String }, // Optional video link
  terms: [{ term: String, definition: String }], // Array of terms
  quiz: [quizQuestionSchema], // Array of quiz questions
  order: { type: Number, required: true }, // Sequencing
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  level: { type: String, enum: ['beginner', 'intermediate', 'expert'], required: true },
  assetco: { type: String, required: true }, // New field for assetco filtering (e.g., 'General', 'EML')
  modules: [moduleSchema],
  required: { type: Boolean, default: false }, // Mandatory for employees
});

const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningCourse', required: true },
  completedModules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LearningCourse.modules' }],
  progress: { type: Number, default: 0 }, // Percentage completed
  certificationEarned: { type: Boolean, default: false },
  lastAccessed: { type: Date, default: Date.now },
});

const LearningCourse = mongoose.models.LearningCourse || mongoose.model('LearningCourse', courseSchema);
const UserProgress = mongoose.models.UserProgress || mongoose.model('UserProgress', userProgressSchema);

export { LearningCourse, UserProgress };