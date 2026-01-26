import mongoose from 'mongoose';

const storageLimitSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null, // null for global limit
    },
    limitBytes: {
        type: Number,
        required: true,
        min: 0,
    },
    usedBytes: {
        type: Number,
        default: 0,
        min: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for quick lookup
storageLimitSchema.index({ userId: 1 }, { unique: true, sparse: true });

storageLimitSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const StorageLimit = mongoose.models.StorageLimit || mongoose.model('StorageLimit', storageLimitSchema);
export default StorageLimit;