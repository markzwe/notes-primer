// Normalizes study board titles and study entry bodies, ensuring they meet length requirements.
export function normalizedTitle(raw) {
    if (typeof raw !== 'string') return null;
    const title = raw.trim();
    return title.length >= 1 && title.length <= 80 ? title : null;
}
export function normalizedBody(raw) {
    if (typeof raw !== 'string') return null;
    const body = raw.trim();
    return body.length >= 1 && body.length <= 280 ? body : null;
}
export function normalizedInvitees(raw) {
    if (!Array.isArray(raw) || raw.length < 1 || raw.length > 2) {
        return null;
    }
    if (raw.some(value => typeof value !== 'string')) return null;
    const names = raw.map(name => name.trim().toLowerCase());
    const pattern = /^[a-z][a-z0-9_]{2,31}$/;
    if (names.some(name => !pattern.test(name))) return null;
    if (new Set(names).size !== names.length) return null;
    return names;
}