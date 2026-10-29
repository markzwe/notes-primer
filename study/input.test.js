import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizedTitle, normalizedBody, normalizedInvitees } from './input.js';
test('reject empty study content', () => {
    assert.equal(normalizedBody(' '), null);
    assert.equal(normalizedTitle(''), null);
});
test('normalize and deduplicate invitees', () => {
    assert.deepEqual(normalizedInvitees([' Bob ', 'CAROL']), ['bob', 'carol']);
    assert.equal(normalizedInvitees(['bob', 'BOB']), null);
});