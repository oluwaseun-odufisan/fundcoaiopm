// admin/backend/models/adminFileModel.js
import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true, trim: true },
    cid: { type: String, required: true, unique: true },
    size: { type: Number, required: true },
    type: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
    tags: [{ type: String, trim: true }],
    isTrashed: { type: Boolean, default: false },
    trashedAt: Date,
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  },
  { timestamps: true }
);

const File = mongoose.models.File || mongoose.model('File', fileSchema);
export default File;