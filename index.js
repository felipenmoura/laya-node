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

let warmedUp = false;
async function warmupModel() {
  if (warmedUp) return;
  warmedUp = true;
  console.log('\x1b[36m⏳ Waking up the Laya model. This might take a moment if weights are loading...\x1b[0m');
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SECRET_API_KEY ? { 'Authorization': `Bearer ${SECRET_API_KEY}` } : {})
      },
      body: JSON.stringify({
        state: "Warmup test",
        questions: { "status": { "type": "choice", "instructions": "Is it working?", "criteria": {"yes": "yes", "no": "no"} } }
      })
    });
    
    if (res.ok) {
      console.log('\n\x1b[32m✔ Laya model is warmed up and the HTTP service is ready to receive requests!\x1b[0m\n');
    } else {
      console.log('\x1b[33m⚠ Model warmup returned a non-OK status, but the server is running.\x1b[0m\n');
    }
  } catch (e) {
    console.error('\x1b[31m✖ Failed to warmup the model:\x1b[0m', e.message, '\n');
  }
}

pythonProcess.stdout.on('data', (data) => {
  // Hide standard stdout to keep terminal clean
});

pythonProcess.stderr.on('data', (data) => {
  const msg = data.toString().trim();
  
  if (msg.includes('Application startup complete.')) {
    warmupModel();
  }
  
  // Hide INFO and specific verbose warnings to keep terminal clean
  if (msg.includes('INFO:') || msg.includes('NotOpenSSLWarning') || msg.includes('MPS autocast') || msg.includes('UserWarning:')) {
    return;
  } else if (msg.includes('WARNING:')) {
    console.log(`\x1b[33m[Laya Engine Warning]: ${msg}\x1b[0m`);
  } else if (msg.includes('%|') || msg.includes('it/s')) {
    // Let tqdm progress bars for downloads show through, but formatted
    process.stdout.write(`\r\x1b[36m${msg}\x1b[0m`);
  } else {
    // Only show real errors
    console.error(`\x1b[31m[Laya Engine Error]: ${msg}\x1b[0m`);
  }
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
  console.log(`You can make requests to http://localhost:${PORT}/predict\n`);
  
  const authHeader = SECRET_API_KEY ? ` \\\n  -H "\x1b[33mAuthorization: Bearer <your-secret-api-key>\x1b[0m"` : '';
  const curlExample = 
    `\x1b[36mcurl\x1b[0m -X POST \x1b[32mhttp://localhost:${PORT}/predict\x1b[0m \\\n` +
    `  -H \x1b[33m"Content-Type: application/json"\x1b[0m${authHeader} \\\n` +
    `  -d \x1b[33m'{\n` +
    `    "state": "The app crashes on startup",\n` +
    `    "questions": {\n` +
    `      "issue": {\n` +
    `        "type": "choice",\n` +
    `        "instructions": "What is the issue?",\n` +
    `        "criteria": {\n` +
    `          "bug": "crash or error",\n` +
    `          "feature": "new request"\n` +
    `        }\n` +
    `      }\n` +
    `    }\n` +
    `  }'\x1b[0m\n`;

  console.log(`\x1b[1mExample Request:\x1b[0m\n${curlExample}`);
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
