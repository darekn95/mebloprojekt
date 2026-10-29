import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const args = process.argv.slice(2);
const root = resolve(args.find(a => !a.startsWith('--')) || '.');
const dir = join(root, 'testy');
const original = join(dir, 'funkcje.mjs');
if (!existsSync(original)) {
  console.error('Brak testy/funkcje.mjs. Podaj katalog aktualnej kopii repozytorium.');
  process.exit(2);
}
let runner = original;
let temporary;
try {
  if (args.includes('--do-139')) {
    const source = readFileSync(original, 'utf8');
    const marker = "console.log('\\n== N140–N149 ==');";
    const cut = source.indexOf(marker);
    if (cut < 0) throw new Error('Nie znaleziono granicy N140–N149; sprawdź aktualny zestaw testów.');
    temporary = join(dir, `.szybki-gpt-${process.pid}.mjs`);
    writeFileSync(temporary, source.slice(0, cut), { flag: 'wx' });
    runner = temporary;
  }
  const started = Date.now();
  const result = spawnSync(process.execPath, [runner], { cwd: root, encoding: 'utf8', timeout: 60000, maxBuffer: 10 * 1024 * 1024 });
  const output = result.stdout || '';
  process.stdout.write(output);
  process.stderr.write(result.stderr || '');
  const ok = (output.match(/^\s*OK\b/gm) || []).length;
  const failed = (output.match(/^\s*BLAD\b/gm) || []).length;
  console.log(`\nWynik: ${ok} OK, ${failed} BLAD; czas ${(Date.now() - started) / 1000} s.`);
  if (result.error || result.status !== 0 || failed || !ok) {
    if (result.error) console.error(result.error.message);
    console.error('Test nie przeszedł lub nie uruchomił żadnych sprawdzeń.');
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
} finally {
  if (temporary && existsSync(temporary)) unlinkSync(temporary);
}
