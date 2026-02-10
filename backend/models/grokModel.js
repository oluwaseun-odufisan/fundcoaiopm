// backend/models/grokModel.js
import mongoose from 'mongoose';
const grokChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  toolId: {
    type: String,
    required: true
  },
  messages: [{
    role: { type: String, enum: ['system', 'user', 'assistant'] },
    content: { type: mongoose.Schema.Types.Mixed }
  }],
  taskContext: {
    type: String
  },
  title: {
    type: String,
    default: 'Untitled Chat'
  },
  summary: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
grokChatSchema.index({ title: 'text', summary: 'text' }); // For search
const GrokChat = mongoose.models.GrokChat || mongoose.model('GrokChat', grokChatSchema);
export default GrokChat;