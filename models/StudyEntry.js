import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyBoard', required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PrimerUser', required: true
    },
    body: { type: String, required: true, trim: true, maxlength: 280 }
}, { timestamps: true });
entrySchema.index({ board: 1, createdAt: -1, _id: -1 });
export const StudyEntry = mongoose.model('StudyEntry', entrySchema);