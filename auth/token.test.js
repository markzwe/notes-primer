import test from 'node:test';
import assert from 'node:assert/strict';
import { signAccessToken, verifyAccessToken } from './token.js';
const id = '0123456789abcdef01234567';
test('issued token verifies', () => {
    assert.equal(verifyAccessToken(signAccessToken(id)), id);
});
test('tampered signature fails', () => {
    const parts = signAccessToken(id).split('.');
    const sig = parts[2];
    parts[2] = (sig[0] === 'A' ? 'B' : 'A') + sig.slice(1);
    assert.throws(() => verifyAccessToken(parts.join('.')));
});