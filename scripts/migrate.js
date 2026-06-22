require('dotenv').config({ path: './.env' });

const { execSync } = require('child_process');

execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });