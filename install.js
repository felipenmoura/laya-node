import util from 'util';
import { exec } from 'child_process';
import ora from 'ora';
import inquirer from 'inquirer';

const execAsync = util.promisify(exec);

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

  const { port, apiKeyChoice, customApiKey, setupPython, downloadModel } = await inquirer.prompt([
    {
      type: 'input',
      name: 'port',
      message: 'The port for the HTTP service',
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
      message: 'Enter the SECRET_API_KEY:',
      when: (answers) => answers.apiKeyChoice === 'custom'
    },
    {
      type: 'select',
      name: 'setupPython',
      message: 'Setup all dependencies (python env, laya, etc)?',
      choices: [
        { name: 'Yes, do your thing', value: true },
        { name: 'No, I will set them up manually myself', value: false },
        { name: 'No, I already have everything set up', value: false },
      ]
    },
    {
      type: 'select',
      name: 'downloadModel',
      message: 'Download the model immediately or during first use?',
      choices: [
        { name: 'Yes, download it now', value: true },
        { name: 'No, download it when the service starts for the first time', value: false },
      ]
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
    const spinner = ora('Setting up Python virtual environment...').start();
    try {
      const venvPath = path.join(__dirname, 'venv');
      if (!fs.existsSync(venvPath)) {
        await execAsync('python3 -m venv venv', { cwd: __dirname });
      }
      
      spinner.text = 'Installing dependencies (laya, fastapi, uvicorn)...';
      const pythonCommand = process.platform === 'win32' 
        ? path.join(venvPath, 'Scripts', 'python')
        : path.join(venvPath, 'bin', 'python');
        
      await execAsync(`"${pythonCommand}" -m pip install fastapi uvicorn laya`, { cwd: __dirname });
      spinner.succeed('Setup complete!');
    } catch (error) {
      spinner.fail('Setup failed during python environment creation or pip install.');
      console.error(error.stdout || error.message);
      if (error.stderr) console.error(error.stderr);
    }
  } else {
    console.log('Skipping python setup. Please ensure laya is available in your python environment.');
  }

  if (downloadModel) {
    const spinner = ora('Downloading Laya model checkpoints...').start();
    try {
      const venvPath = path.join(__dirname, 'venv');
      const pythonCommand = fs.existsSync(venvPath)
        ? (process.platform === 'win32' ? path.join(venvPath, 'Scripts', 'python') : path.join(venvPath, 'bin', 'python'))
        : 'python3';
      
      await execAsync(`${pythonCommand} -c "import warnings; warnings.filterwarnings('ignore'); from laya import Router; Router(preload=True)"`, { cwd: __dirname });
      spinner.succeed('Model downloaded successfully!');
    } catch (error) {
      spinner.fail('Failed to download the model.');
      console.error(error.stdout || error.message);
      if (error.stderr) console.error(error.stderr);
    }
  }
}

runSetup().catch(err => {
  console.error('Setup failed:', err);
});
