import mongoose from 'mongoose';

// Schema for a user, including their username and password hash.
const userSchema = new mongoose.Schema({
    username: {
        type: String, required: true, trim: true,
        lowercase: true, unique: true,
        match: /^[a-z][a-z0-9_]{2,31}$/
    },
    passwordHash: {
        type: String, required: true, select: false
    }
}, { timestamps: true });
export const PrimerUser = mongoose.model('PrimerUser', userSchema);