export function normalizedUsername(raw) {
    if (typeof raw !== 'string') return null;
    const username = raw.trim().toLowerCase();
    return /^[a-z][a-z0-9_]{2,31}$/.test(username)
        ? username : null;
}
export function validNewPassword(raw) {
    return typeof raw === 'string'
        && raw.length >= 12
        && Buffer.byteLength(raw, 'utf8') <= 72;
}