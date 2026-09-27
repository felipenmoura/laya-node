import 'dotenv/config';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pidFile = path.join(__dirname, '.daemon.pid');

if (process.argv.includes('--stop')) {
  if (fs.existsSync(pidFile)) {
    const pid = parseInt(fs.readFileSync(pidFile, 'utf8'), 10);
    try {
      process.kill(pid, 'SIGTERM');
      console.log(`\n\x1b[32m✔ Successfully stopped Laya daemon (PID ${pid}).\x1b[0m\n`);
    } catch (e) {
      if (e.code === 'ESRCH') {
        console.log(`\n\x1b[33m⚠ Daemon process (PID ${pid}) was not running.\x1b[0m\n`);
      } else {
        console.error(`\n\x1b[31m✖ Failed to stop daemon:\x1b[0m`, e.message, '\n');
      }
    }

    try {
      fs.unlinkSync(pidFile);
    } catch (e) {
      // it was probably removed by the processs that finished
    }
  } else {
    console.log(`\n\x1b[33m⚠ No daemon PID file found. Is the server running in the background?\x1b[0m\n`);
  }
  process.exit(0);
}

const isDaemonArg = process.argv.includes('-D');
const isDaemonChild = process.argv.includes('--is-daemon-child');

const onlyStudioIndex = process.argv.indexOf('--only-studio');
const isOnlyStudio = onlyStudioIndex !== -1;

let toolPort = null;
if (isOnlyStudio) {
  toolPort = process.argv[onlyStudioIndex + 1] ? parseInt(process.argv[onlyStudioIndex + 1], 10) : 4001;
  if (isNaN(toolPort)) toolPort = 4001;
} else {
  const toolArgIndex = process.argv.indexOf('--studio');
  toolPort = toolArgIndex !== -1 ? parseInt(process.argv[toolArgIndex + 1], 10) : null;
  if (toolArgIndex !== -1 && isNaN(toolPort)) toolPort = 4001;
}


if (isDaemonArg) {
  const childArgs = process.argv.slice(2).filter(a => a !== '-D');
  childArgs.push('--is-daemon-child');

  const child = spawn(process.execPath, [__filename, ...childArgs], {
    detached: true,
    stdio: ['ignore', 'inherit', 'inherit', 'ipc']
  });

  fs.writeFileSync(pidFile, child.pid.toString());

  child.on('message', (msg) => {
    if (msg === 'WARMUP_COMPLETE') {
      console.log('\n\x1b[35m[Daemon] Disconnecting from terminal. Laya is now running in the background.\x1b[0m\n');
      child.disconnect();
      child.unref();
      process.exit(0);
    }
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });

  // Suspend the parent process from running the actual server logic
  await new Promise(() => {});
}

const PORT = process.env.PORT || 4000;
const PYTHON_PORT = parseInt(PORT, 10) + 1; // dynamically assign python port based on node port
const SECRET_API_KEY = process.env.SECRET_API_KEY;

if (isOnlyStudio) {
  const toolApp = express();
  toolApp.use(express.static(path.join(__dirname, 'tool-ui')));
  toolApp.use(express.json());

  toolApp.post('/api/predict', async (req, res) => {
    try {
      const fetchParams = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      };
      if (SECRET_API_KEY) {
        fetchParams.headers['Authorization'] = `Bearer ${SECRET_API_KEY}`;
      }

      const response = await fetch(`http://127.0.0.1:${PORT}/predict`, fetchParams);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to communicate with Laya server.', details: err.message });
    }
  });

  toolApp.get('/api/config', (req, res) => {
    res.json({ port: PORT });
  });

  toolApp.listen(toolPort, () => {
    console.log(`\n╭────────────────────────────────────────╮`);
    console.log(`│ \x1b[94mi\x1b[0m Studio Summary                       │`);
    console.log(`├───────────┬────────────────────────────┤`);
    console.log(`│ Studio    │ \x1b[33m${toolPort.toString().padEnd(26)}\x1b[0m │`);
    console.log(`│ API URL   │ \x1b[94m${`http://127.0.0.1:${PORT}`.padEnd(26)}\x1b[0m │`);
    console.log(`╰───────────┴────────────────────────────╯\n`);
  });

  // Suspend the parent process from running the rest of the server logic
  await new Promise(() => {});
}

// Path to the python executable
const venvPath = path.join(__dirname, 'venv');
const pythonExec = process.platform === 'win32'
  ? path.join(venvPath, 'Scripts', 'python')
  : path.join(venvPath, 'bin', 'python');

const uvicornExec = process.platform === 'win32'
  ? path.join(venvPath, 'Scripts', 'uvicorn')
  : path.join(venvPath, 'bin', 'uvicorn');

// Check if venv exists, otherwise fallback to system python
const useVenv = fs.existsSync(pythonExec);
const command = useVenv ? pythonExec : 'python3';
const args = ['-m', 'uvicorn', 'server:app', '--port', PYTHON_PORT.toString()];

console.log(`Starting python server via ${command} ${args.join(' ')}...`);

const pythonProcess = spawn(command, args, {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe']
});

pythonProcess.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error(`\n\x1b[31m✖ Error: Could not find Python executable or uvicorn.\x1b[0m`);
    console.error(`\x1b[33mPlease ensure you have run the setup or installed dependencies in the virtual environment.\x1b[0m\n`);
  } else {
    console.error(`\n\x1b[31m✖ Failed to start Python server:\x1b[0m ${err.message}\n`);
  }
  process.exit(1);
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
      if (isDaemonChild && process.send) {
        process.send('WARMUP_COMPLETE');
      }
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

const server = app.listen(PORT, () => {
  // Server started
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n\x1b[31m✖ Error: Port ${PORT} is already in use.\x1b[0m`);
    console.error(`\x1b[33mPlease ensure no other process is using this port, or specify a different PORT environment variable.\x1b[0m\n`);
    process.exit(1);
  } else {
    console.error(`\n\x1b[31m✖ Server error:\x1b[0m`, err.message, '\n');
  }
});

if (toolPort) {
  const toolApp = express();
  toolApp.use(express.static(path.join(__dirname, 'tool-ui')));
  toolApp.use(express.json());

  toolApp.post('/api/predict', async (req, res) => {
    try {
      const fetchParams = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      };
      if (SECRET_API_KEY) {
        fetchParams.headers['Authorization'] = `Bearer ${SECRET_API_KEY}`;
      }

      const response = await fetch(`http://127.0.0.1:${PORT}/predict`, fetchParams);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to communicate with Laya server.', details: err.message });
    }
  });
  toolApp.get('/api/config', (req, res) => {
    res.json({ port: PORT });
  });

  toolApp.listen(toolPort, () => {
    // Tool started
  });
}

setTimeout(() => {
  const ipAddress = '127.0.0.1';
  const portStr = PORT.toString();
  const urlStr = `http://${ipAddress}:${portStr}`;
  const uiStr = toolPort ? `${toolPort}` : '--';
  
  let secretStr = '--';
  if (SECRET_API_KEY) {
    if (SECRET_API_KEY.length >= 8) {
      secretStr = SECRET_API_KEY.slice(0, 4) + '•'.repeat(18) + SECRET_API_KEY.slice(-4);
    } else {
      secretStr = '*'.repeat(26);
    }
  }
  const warmedStr = process.argv.includes('--no-warm') ? 'NO' : 'YES';

  const tableStr = `
╭────────────────────────────────────────╮
│ \x1b[94mi\x1b[0m Summary                              │
├───────────┬────────────────────────────┤
│ API URL   │ \x1b[94m${urlStr.padEnd(26)}\x1b[0m │
│ Port      │ \x1b[33m${portStr.padEnd(26)}\x1b[0m │
│ Studio    │ \x1b[33m${uiStr.padEnd(26)}\x1b[0m │
│ Secret    │ \x1b[33m${secretStr.padEnd(26)}\x1b[0m │
│ Warmed up │ \x1b[33m${warmedStr.padEnd(26)}\x1b[0m │${
  !toolPort
    ? `
├───────────┴────────────────────────────┤
│ \x1b[94mTip:\x1b[0m                                   |
│ To start the Studio UI, run:           │
│ pnpm start:studio                      │`
    : ''
}
╰────────────────────────────────────────╯
`;
  console.log(tableStr);

}, 250);

// Clean up child process on exit
process.on('SIGINT', () => {
  pythonProcess.kill('SIGINT');
  if (isDaemonChild && fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
  process.exit();
});

process.on('SIGTERM', () => {
  pythonProcess.kill('SIGTERM');
  if (isDaemonChild && fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
  process.exit();
});
