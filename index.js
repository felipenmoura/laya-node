import 'dotenv/config';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4000;
const PYTHON_PORT = parseInt(PORT, 10) + 1; // dynamically assign python port based on node port
const SECRET_API_KEY = process.env.SECRET_API_KEY;

// Path to the python executable
const venvPath = path.join(__dirname, 'venv');
const pythonExec = process.platform === 'win32'
  ? path.join(venvPath, 'Scripts', 'python')
  : path.join(venvPath, 'bin', 'python');

const uvicornExec = process.platform === 'win32'
  ? path.join(venvPath, 'Scripts', 'uvicorn')
  : path.join(venvPath, 'bin', 'uvicorn');

// Check if venv exists, otherwise fallback to system python
const useVenv = fs.existsSync(uvicornExec);
const command = useVenv ? uvicornExec : 'uvicorn';

console.log(`Starting python server via ${command}...`);

const pythonProcess = spawn(command, ['server:app', '--port', PYTHON_PORT.toString()], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe']
});

pythonProcess.stdout.on('data', (data) => {
  console.log(`[Laya Engine]: ${data.toString().trim()}`);
});

pythonProcess.stderr.on('data', (data) => {
  console.error(`[Laya Engine Error]: ${data.toString().trim()}`);
});

pythonProcess.on('close', (code) => {
  console.log(`Python process exited with code ${code}`);
  process.exit(code);
});

// Setup Express to proxy requests
const app = express();

// Authorization middleware
if (SECRET_API_KEY) {
  app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${SECRET_API_KEY}`) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
    }
    next();
  });
}

app.use('/', createProxyMiddleware({
  target: `http://127.0.0.1:${PYTHON_PORT}`,
  changeOrigin: true,
  logLevel: 'silent',
  onError: (err, req, res) => {
    res.status(502).json({ error: 'Laya Engine is not reachable or still starting up.' });
  }
}));

app.listen(PORT, () => {
  console.log(`Laya Node wrapper is running on http://localhost:${PORT}`);
  if (SECRET_API_KEY) {
    console.log(`API Key protection is ENABLED. Please send "Authorization: Bearer <your-key>"`);
  }
  console.log(`You can make requests to http://localhost:${PORT}/predict`);
});

// Clean up child process on exit
process.on('SIGINT', () => {
  pythonProcess.kill('SIGINT');
  process.exit();
});

process.on('SIGTERM', () => {
  pythonProcess.kill('SIGTERM');
  process.exit();
});
