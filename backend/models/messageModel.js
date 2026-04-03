// models/messageModel.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat',
            required: [true, 'Chat ID is required'],
            validate: {
                validator: (v) => mongoose.isValidObjectId(v),
                message: 'Invalid Chat ID',
            },
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: [true, 'Sender ID is required'],
            validate: {
                validator: (v) => mongoose.isValidObjectId(v),
                message: 'Invalid Sender ID',
            },
        },
        content:     { type: String, trim: true },
        fileUrl:     { type: String, trim: true },
        fileName:    { type: String, trim: true },
        contentType: {
            type: String,
            enum: ['image', 'video', 'audio', 'application', ''],
            default: '',
        },
        isDeleted: { type: Boolean, default: false },
        isEdited:  { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Performance indexes
// Primary: paginated message fetch + last-message aggregation per chat
messageSchema.index({ chatId: 1, createdAt: -1 });
// Secondary: sender-level queries
messageSchema.index({ sender: 1, createdAt: -1 });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
export default Message;