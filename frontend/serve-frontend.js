import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serve = spawn('serve', ['-s', 'dist', '-l', '5173'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

serve.on('error', (err) => {
  console.error('Failed to start serve:', err);
  process.exit(1);
});

serve.on('exit', (code) => {
  process.exit(code);
});
