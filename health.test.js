import test from 'node:test';
import assert from 'node:assert/strict';

test('health responds with 200 adnd JSON', async () => {
  const res = await fetch('http://127.0.0.1:3000/api/health');
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.deepEqual(json, { status: 'ok' });
});