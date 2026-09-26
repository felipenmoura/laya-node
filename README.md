# laya-node

Node wrapper for running the Laya text classification model.

[Laya](https://huggingface.co/convaiinnovations/laya) is a non-autoregressive decision model designed for text classification, email triage, and moderation. This package exposes Laya's API through an Express HTTP server, allowing you to easily integrate it into your Node.js applications while keeping the exact same API structure.

## Installation

```bash
npm install
# or
pnpm install
```

During installation, you will be prompted via `inquirer` to set up the Python environment.
If you choose "yes", the script will create a virtual environment (`venv`) and install `laya`, `fastapi`, and `uvicorn`.

## Usage

Start the server:

```bash
npm start
```

The Express wrapper starts on `http://localhost:4000`, spawning a background Python server that loads the Laya model and proxies requests to it.

### Example Request

Send a POST request to `/predict` with your text state and questions schema.

```bash
curl -X POST http://localhost:4000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "state": "The app crashes on startup",
    "questions": {
      "issue": {
        "type": "choice",
        "instructions": "What is the issue?",
        "criteria": {
          "bug": "crash or error",
          "feature": "new request"
        }
      }
    }
  }'
```

The response will follow Laya's exact Python `router.predict` structure.
