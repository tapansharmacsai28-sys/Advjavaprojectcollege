import { cp, mkdir, writeFile } from 'node:fs/promises';

const outputDirectory = 'dist';
const apiBase = (process.env.TRADEVAULT_API_BASE || '').replace(/\/$/, '');

await mkdir(outputDirectory, { recursive: true });
await cp('src/main/resources/static', outputDirectory, { recursive: true });
await writeFile(
  `${outputDirectory}/config.js`,
  `window.TRADEVAULT_API_BASE = ${JSON.stringify(apiBase)};\n`,
  'utf8'
);
