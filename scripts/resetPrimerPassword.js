import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { PrimerUser } from '../models/PrimerUser.js';
import { normalizedUsername, validNewPassword } from '../auth/input.js';
const username = normalizedUsername(process.argv[2]);
if (username === null) {
    console.error('Usage: node scripts/resetPrimerPassword.js USERNAME');
    process.exit(1);
}
process.stdin.setEncoding('utf8');
let newPassword = '';
for await (const chunk of process.stdin) {
    newPassword += chunk;
}
if (validNewPassword(newPassword) === false) {
    console.error('Password must satisfy the 04E registration rule.');
    process.exit(1);
}
const mongoUri = process.env.MONGODB_URI ??
    'mongodb://127.0.0.1:27018/capstone_notes_primer';
try {
    await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000
    });
    const user = await PrimerUser.findOne({ username });
    if (user === null) {
        console.error(`No such account: ${username}`);
        process.exitCode = 1;
    } else {
        user.passwordHash = await bcrypt.hash(newPassword, 12);
        await user.save();
        console.log(`Password reset for ${username}. Log in again.`);
    }
} catch (err) {
    console.error(`Reset failed: ${err.message}`);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}