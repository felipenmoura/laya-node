# Laya Node Wrapper

The Node.js wrapper for running the [Laya Text Classification Model](https://huggingface.co/convaiinnovations/laya).

Laya is a non-autoregressive decision model designed for text classification, email triage, and moderation. This package exposes Laya's API through an Express HTTP server, allowing you to easily integrate it into your Node.js applications while matching the exact Python API structure natively.

## Features
- **Zero-Config Installation**: Just follow the instructions during the install process.
- **API Key Protection**: Built-in authorization token support to secure your endpoint.
- **Daemon Mode**: Easily run the inference server in the background as a daemon.
- **Automated Warmup**: Pre-loads the model weights upon startup so your first HTTP request is lightning fast.
- **Clean CLI UX**: Smooth cli experience.

## Installation

```bash
npm install
# or
pnpm install
```

During installation, an interactive prompt will ask you:
1. Which **Port** the Express server should bind to (default: `4000`).
2. Whether to generate or set a custom **Secret API Key** for route protection.
3. Whether to automatically set up the Python `venv` environment.
4. Whether to download the Laya model weights immediately.

Your preferences will be saved securely to a `.env` file (which is automatically git-ignored).

### Additional Environment Variables
You can manually edit your `.env` file to configure additional parameters:
- `MAX_LEN`: Controls the maximum token length passed to the Laya model during predictions. Defaults to `8192` if not provided.
- `PORT`: The port for the Express server. Defaults to `4000` if not provided.
- `SECRET_API_KEY`: The SECRET API key required to access the API.

## Usage

### Running the Server

To start the server:
```bash
npm start
# or
pnpm start
```

The server will initialize, bind to the configured port, require the correct API Secret for any incomming message, automatically wake up the Laya model in the background (warm up).

It will show you a `curl` sample on how to call it, too.

### Running in the Background (Daemon Mode)

To start the server as a background daemon process:
```bash
pnpm start -D
# or
npm run start -- -D
```
The wrapper will boot up, perform the startup warmup routines, print the success logs to your terminal, and detach.

To shut down the background daemon:
```bash
pnpm stop
# or 
npm run stop
```

## Making Predictions

Once running, send a `POST` request to `/predict`. Be sure to include your Bearer token if you enabled API Key protection during setup.

### Example Request

```bash
curl -X POST http://localhost:4000/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-secret-api-key>" \
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

### Example Response

```json
{
  "model": "laya-rl-agent",
  "answers": {
    "issue": {
      "type": "choice",
      "choice": "bug",
      "probabilities": {
        "bug": 0.9764,
        "feature": 0.0236
      },
      "confidence": 0.8388,
      "action": {
        "act_probability": 1.0
      }
    }
  },
  "usage": {
    "input_tokens": 28,
    "output_tokens": 0
  },
  "routing": {
    "model": "english",
    "repo": "convaiinnovations/laya",
    "reason": "English Latin text",
    "detection": {
      "script": "latin",
      "script_profile": {
        "latin": 1.0
      },
      "language": "en",
      "is_english": true,
      "non_latin_fraction": 0.0
    },
    "workflow": null
  }
}
```

## License

This project is licensed under the [MIT License](LICENSE).
