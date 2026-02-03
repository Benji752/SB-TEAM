import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

await esbuild.build({
  entryPoints: [resolve(rootDir, 'api/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: resolve(rootDir, 'api/handler.js'),
  external: [
    'express',
    'drizzle-orm',
    'drizzle-orm/*',
    '@neondatabase/serverless',
    'drizzle-zod',
    'zod',
    'connect-pg-simple',
    'express-session',
    'memorystore',
    'passport',
    'passport-local',
    'openid-client',
    'ws',
    'http',
    'vite'
  ],
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});

console.log('Build completed: api/handler.js');
