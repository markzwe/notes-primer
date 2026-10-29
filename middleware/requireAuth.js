import { verifyAccessToken } from '../auth/token.js';

export function requireAuth(req, res, next) {
    const authorization = req.get('authorization') ?? '';
    const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
    if (match === null) {
        return res.status(401).json({ error: 'authentication required' });
    }

    try {
        const userId = verifyAccessToken(match[1]);
        req.auth = { userId };
        return next();
    } catch {
        return res.status(401).json({ error: 'invalid or expired token' });
    }
}
