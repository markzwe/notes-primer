import jwt from 'jsonwebtoken';

// JWT secret and signing settings for access tokens.
const secret = process.env.JWT_SECRET;
if (typeof secret !== 'string'
    || /^[0-9a-f]{64}$/i.test(secret) === false) {
    throw new Error('JWT_SECRET must be 64 random hex characters');
}

// JWT signing settings for access tokens.
const settings = {
    algorithm: 'HS256',
    issuer: 'notes-primer',
    audience: 'notes-api'
};

// Sign an access token for a given user ID.
export function signAccessToken(userId) {
    return jwt.sign({}, secret, {
        ...settings, subject: userId.toString(), expiresIn: '15m'
    });
}

export function verifyAccessToken(token) {
    const claims = jwt.verify(token, secret, {
        algorithms: ['HS256'],
        issuer: settings.issuer,
        audience: settings.audience,
        clockTolerance: 5
    });
    if (typeof claims !== 'object'
        || typeof claims.sub !== 'string'
        || /^[0-9a-f]{24}$/i.test(claims.sub) === false
        || typeof claims.exp !== 'number') {
        throw new Error('invalid token claims');
    }
    return claims.sub;
}