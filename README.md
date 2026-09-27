# Laya Node Wrapper

The Node.js wrapper for running the [Laya Text Classification Model](https://huggingface.co/convaiinnovations/laya), the multilingual, non-autoregressive System 1 decision model for AI (for artificial intelligence).

Laya is a non-autoregressive decision model designed for text classification, email triage, moderation and classification.  
This package exposes the HTTP API to allow you to easily integrate it into your Node.js applications and environment.  
It can be configured to require a _secret key_ and includes a **Studio UI** you may use to try and validate the schemas and prompts.

In the end, this works as an **alternative to Jev**.

## Features
- **Zero-Config Installation**: Just follow the instructions during the install process.
- **API Key Protection**: Built-in authorization token support to secure your endpoint.
- **Daemon Mode**: Easily run the inference server in the background as a daemon.
- **Automated Warmup**: Pre-loads the model weights upon startup so your first HTTP request is lightning fast.
- **Clean CLI UX**: Smooth cli experience.
- **Studio**: A full featured Studio UI to test your prompts and schemas

<img width="1992" height="1042" alt="image" src="https://github.com/user-attachments/assets/d82168fd-56e3-42c7-b276-795dc97105b3" />

## Installation

```bash
git clone git@github.com:felipenmoura/laya-node.git
cd laya-node

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

### Starting the Studio UI

To start the built-in visual Studio UI for testing prompts and configurations:
```bash
pnpm start:studio
# or
npm run start:studio
```

You can also start the studio at the same time with the main service:  
`pnpm start --studio 4001`

### Running with Docker

You can easily containerize this wrapper and run it anywhere using Docker. The included `Dockerfile` will automatically fetch the model weights during the build phase so container startups remain fast.

To build the image:
```bash
docker build -t laya-node-wrapper .
```

To run the container (exposing port 4000):
```bash
docker run -p 4000:4000 -e SECRET_API_KEY="my-secure-key" laya-node-wrapper
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
