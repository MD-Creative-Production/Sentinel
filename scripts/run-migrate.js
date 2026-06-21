require('dotenv').config({ path: './.env' });

const { spawn } = require('child_process');

const migrate = spawn('npx', ['prisma', 'migrate', 'dev', '--name', 'init'], {
  stdio: 'inherit',
  shell: true,
});

migrate.on('close', (code) => {
  process.exit(code);
});