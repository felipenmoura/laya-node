import inquirer from 'inquirer';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSetup() {
  console.log('Laya Node wrapper setup');
  
  if (process.env.CI || !process.stdout.isTTY) {
    console.log('Non-interactive environment detected. Skipping python setup.');
    return;
  }

  const envPath = path.join(__dirname, '.env');
  const envExists = fs.existsSync(envPath);
  
  let currentPort = '4000';
  let currentApiKey = '';
  
  if (envExists) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const portMatch = envContent.match(/^PORT=(.*)$/m);
    if (portMatch) currentPort = portMatch[1];
  }

  const { port, apiKeyChoice, customApiKey, setupPython } = await inquirer.prompt([
    {
      type: 'input',
      name: 'port',
      message: 'What port should the Express server run on?',
      default: currentPort
    },
    {
      type: 'select',
      name: 'apiKeyChoice',
      message: 'How do you want to configure the SECRET_API_KEY?',
      choices: [
        { name: 'Generate a random key', value: 'generate' },
        { name: 'Enter a custom key', value: 'custom' },
        { name: 'Skip (no key needed / keep existing)', value: 'skip' }
      ]
    },
    {
      type: 'input',
      name: 'customApiKey',
      message: 'Enter your SECRET_API_KEY:',
      when: (answers) => answers.apiKeyChoice === 'custom'
    },
    {
      type: 'confirm',
      name: 'setupPython',
      message: 'Do you want to automatically setup the python environment (venv) and install laya?',
      default: true
    }
  ]);

  let finalApiKey = '';
  if (apiKeyChoice === 'generate') {
    finalApiKey = crypto.randomBytes(32).toString('hex');
  } else if (apiKeyChoice === 'custom') {
    finalApiKey = customApiKey;
  }

  // Write or update .env file
  if (!envExists || apiKeyChoice !== 'skip' || port !== currentPort) {
    let envContent = envExists ? fs.readFileSync(envPath, 'utf8') : '';
    
    // Update or append PORT
    if (envContent.match(/^PORT=/m)) {
      envContent = envContent.replace(/^PORT=.*$/m, `PORT=${port}`);
    } else {
      envContent += `\nPORT=${port}`;
    }

    // Update or append SECRET_API_KEY
    if (finalApiKey) {
      if (envContent.match(/^SECRET_API_KEY=/m)) {
        envContent = envContent.replace(/^SECRET_API_KEY=.*$/m, `SECRET_API_KEY=${finalApiKey}`);
      } else {
        envContent += `\nSECRET_API_KEY=${finalApiKey}`;
      }
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log(`Updated .env file with Port: ${port}${finalApiKey ? ' and Secret API Key' : ''}`);
  }

  if (setupPython) {
    console.log('Setting up Python virtual environment...');
    const venvPath = path.join(__dirname, 'venv');
    if (!fs.existsSync(venvPath)) {
      execSync('python3 -m venv venv', { stdio: 'inherit', cwd: __dirname });
    }
    
    console.log('Installing dependencies (laya, fastapi, uvicorn)...');
    const pipCommand = process.platform === 'win32' 
      ? path.join(venvPath, 'Scripts', 'pip')
      : path.join(venvPath, 'bin', 'pip');
      
    execSync(`${pipCommand} install fastapi uvicorn laya`, { stdio: 'inherit', cwd: __dirname });
    console.log('Setup complete!');
  } else {
    console.log('Skipping python setup. Please ensure laya is available in your python environment.');
  }
}

runSetup().catch(err => {
  console.error('Setup failed:', err);
});
