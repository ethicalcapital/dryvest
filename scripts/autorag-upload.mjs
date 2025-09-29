#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: node scripts/autorag-upload.mjs <file1> [file2 ...]

Uploads local research papers to the R2 bucket bound to the Dryvest AutoRAG corpus.
Each file is stored under originals/<timestamp>-<basename>. After upload, run the
markdown conversion helper:

  curl -X POST https://dryvest.ethicic.com/api/autorag/convert -H 'Content-Type: application/json' -d '{"limit":20}'
`);
    process.exit(0);
  }

  for (const input of args) {
    const resolved = path.resolve(input);
    try {
      const stats = await fs.stat(resolved);
      if (!stats.isFile()) {
        console.error(`Skipping ${input}: not a file.`);
        continue;
      }
    } catch (error) {
      console.error(`Skipping ${input}: ${(error).message}`);
      continue;
    }

    const basename = path.basename(resolved);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const remoteKey = `originals/${stamp}-${basename}`;

    console.log(`→ Uploading ${basename} → ${remoteKey}`);
    const result = spawnSync('npx', [
      'wrangler',
      'r2',
      'object',
      'put',
      'dryvest',
      remoteKey,
      '--file',
      resolved,
    ], { stdio: 'inherit' });

    if (result.status !== 0) {
      console.error(`Failed to upload ${basename}.`);
      process.exit(result.status ?? 1);
    }
  }

  console.log('✔ Upload complete. Remember to run the markdown conversion endpoint to process the new objects.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
