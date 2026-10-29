import { Router } from 'express';
import bcrypt from 'bcrypt';
import { PrimerUser } from '../models/PrimerUser.js';
import { normalizedUsername, validNewPassword } from '../auth/input.js';
import { signAccessToken } from '../auth/token.js';
export const authRouter = Router();

// User registration route
authRouter.post('/register', async (req, res, next) => {
    // Normalize usernames before validation and persistence so equivalent inputs
    // cannot create separate accounts.
    const username = normalizedUsername(req.body?.username);
    const password = req.body?.password;
    if (username === null || validNewPassword(password) === false) {
        return res.status(400).json({ error: 'invalid registration input' });
    }
    try {
        // Store only a one-way password hash; the plaintext password is never persisted.
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await PrimerUser.create({ username, passwordHash });
        return res.status(201).json({
            user: {
                id: user.id, username: user.username
            }
        });
    } catch (err) {
        // The unique username index rejects concurrent registrations for the same name.
        if (err?.code === 11000) {
            return res.status(409).json({ error: 'username unavailable' });
        }
        next(err);
    }
});

// User login route
authRouter.post('/login', async (req, res, next) => {
    const username = normalizedUsername(req.body?.username);
    const password = req.body?.password;
    if (username === null || typeof password !== 'string'
        || Buffer.byteLength(password, 'utf8') > 72) {
        return res.status(401).json({ error: 'invalid credentials' });
    }
    try {
        // Find the user by username and include the password hash for comparison.
        const user = await PrimerUser.findOne({ username })
            .select('+passwordHash');
        // Compare the provided password with the stored hash.
        const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
        if (!valid) {
            return res.status(401).json({ error: 'invalid credentials' });
        }
        // Generate an access token for the authenticated user.
        const accessToken = signAccessToken(user.id);
        return res.status(200).json({
            user: {
                id: user.id,
                username: user.username
            },
            accessToken
        });
    } catch (err) {
        next(err);
    }
});