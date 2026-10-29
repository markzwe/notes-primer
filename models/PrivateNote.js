import mongoose from 'mongoose';

// Define the data and persistence rules shared by all private notes.
const privateNoteSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PrimerUser', required: true, index: true
    },

    text: { type: String, required: true, trim: true, maxlength: 280 }
}, { timestamps: true });

const PrivateNote = mongoose.model('PrivateNote', privateNoteSchema);
export default PrivateNote;
