import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';

process.env.JWT_SECRET = randomBytes(32).toString('hex');
const { httpServer, io } = await import('./app.js');

test('health works without a database and readiness reports unavailable', async (t) => {
  t.after(() => new Promise((resolve) => io.close(resolve)));
  httpServer.listen(0, '127.0.0.1');
  await once(httpServer, 'listening');
  const base = `http://127.0.0.1:${httpServer.address().port}`;
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.deepEqual(json, { status: 'ok' });
  const ready = await fetch(`${base}/api/ready`);
  assert.equal(ready.status, 503);
  assert.deepEqual(await ready.json(), { status: 'unavailable' });
});
