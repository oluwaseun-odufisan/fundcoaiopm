// backend/models/postModel.js
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  content: { type: String, required: true, trim: true, maxlength: 500 },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true,
  },
  content: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  fileUrl: {
    type: String,
    trim: true,
  },
  contentType: {
    type: String,
    enum: ['image', 'video', 'application', ''],
    default: '',
  },
  // Reactions: { userId: emojiType }
  reactions: {
    type: Map,
    of: String,  // userId → emoji key e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'fire'
    default: {},
  },
  comments: {
    type: [commentSchema],
    default: [],
  },
  bookmarkedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  }],
  views: {
    type: Number,
    default: 0,
  },
  edited: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Text index for search
postSchema.index({ content: 'text' });
postSchema.index({ createdAt: -1 });

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
export default Post;