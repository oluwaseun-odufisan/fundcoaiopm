import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['individual', 'group'],
            required: [true, 'Chat type is required'],
        },
        name: {
            type: String,
            trim: true,
            required: [
                function () {
                    return this.type === 'group';
                },
                'Group name is required',
            ],
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user',
                required: [true, 'Member ID is required'],
                validate: {
                    validator: (v) => mongoose.isValidObjectId(v),
                    message: 'Invalid Member ID',
                },
            },
        ],
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Indexes for performance
chatSchema.index({ members: 1, type: 1 });
chatSchema.index({ type: 1, updatedAt: -1 });

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

export default Chat;