import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const target = fileURLToPath(new URL('../backend/.env.local', import.meta.url));
if (existsSync(target)) {
  console.log('backend/.env.local already exists; preserved it.');
} else {
  const mongoPort = process.argv.includes('--reuse-local-mongo') ? 27019 : 27020;
  writeFileSync(target, `MONGODB_URI=mongodb://127.0.0.1:${mongoPort}/messenger_complete\nPORT=3002\nJWT_SECRET=${randomBytes(32).toString('hex')}\n`, { mode: 0o600 });
  console.log('Created backend/.env.local with a new secret and a separate messenger_complete database.');
}
