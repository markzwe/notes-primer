import test from 'node:test';
import assert from 'node:assert/strict';
import { Note } from './models/Notes.js';

test('trims valid text', () => {
    const note = new Note({ text: ' Hello ' });
    assert.equal(note.text, 'Hello');
    assert.equal(note.validateSync(), undefined);
});
test('rejects blank text', () => {
    const note = new Note({ text: ' ' });
    assert.ok(note.validateSync()?.errors.text);
});
