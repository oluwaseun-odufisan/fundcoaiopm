import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        match: /^[a-zA-Z0-9._\-\s]+$/,
        maxlength: 100,
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Folder = mongoose.models.Folder || mongoose.model('Folder', folderSchema);
export default Folder;