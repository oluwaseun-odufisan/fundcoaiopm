// fileModel.js
import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true,
    },
    cid: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        default: null,
    },
    taskTitle: {
        type: String,
        default: null,
    },
    folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null,
    },
    tags: {
        type: [String],
        default: [],
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
    shareLink: {
        type: String,
        default: null,
    },
    shareExpires: {
        type: Date,
        default: null,
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
});

// Define indexes (ensure cid is non-unique)
fileSchema.index({ owner: 1, uploadedAt: -1 }); // For efficient getFiles queries
fileSchema.index({ cid: 1 }, { unique: false }); // Explicitly non-unique index for CID lookups

const File = mongoose.models.File || mongoose.model('File', fileSchema);
export default File;