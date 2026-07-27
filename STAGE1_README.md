# Stage 1: Backend Skeleton

## What's Built

A Node.js Express server with WebSocket support that:
- Maintains persistent conversation history per client
- Streams responses from your local Ollama server
- Handles multiple concurrent connections
- Provides real-time text streaming

## Prerequisites

✅ You should have completed Stage 0:
- Ollama installed and `qwen2.5:7b` model downloaded
- Python 3 and Node.js installed
- Claude Code opened on this project

## Setup & Installation

### 1. Start Ollama (if not already running)

Open a terminal and run:
```bash
ollama serve
```

You should see:
```
Listening on 127.0.0.1:11434
```

Keep this terminal open in the background.

### 2. Install Dependencies

```bash
npm install
```

This installs:
- `express` — HTTP server framework
- `ws` — WebSocket library
- `axios` — HTTP client for Ollama API
- `dotenv` — Environment variable management
- `nodemon` — Auto-reload during development

### 3. Configure Environment

Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Default values are already correct:
- `OLLAMA_HOST=http://localhost:11434` (your local Ollama)
- `PORT=3000` (server port)

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

You should see:
```
Server running on http://localhost:3000
WebSocket endpoint: ws://localhost:3000/agent-session
Ollama host: http://localhost:11434
```

## Testing the Backend

### Quick Test with the Included Client

In a new terminal (keep the server running):
```bash
npm run dev
# Wait for server to start, then in another terminal:
node test-client.js
```

You'll get a prompt. Try:
```
You: Hello, who are you?
```

You should see the model's response stream back in real-time.

### Test Messages to Try

- `"What can you do?"` — tests basic response
- `"Tell me about food delivery"` — tests context
- `"My name is Alex"` — tests conversation memory (ask a follow-up like "What's my name?" to test)

### Using websocat (Alternative Testing)

If you have `websocat` installed:
```bash
websocat ws://localhost:3000/agent-session
```

Then type your messages.

## WebSocket Message Format

### Client → Server
Plain text message:
```
"Show me some biryani"
```

### Server → Client
Messages are JSON with `type`:

```json
{ "type": "ready", "message": "..." }
{ "type": "token", "content": "text chunk" }
{ "type": "complete", "message": "Response complete" }
{ "type": "error", "message": "error details" }
```

**token** messages stream continuously as the model thinks. **complete** signals the response is done.

## How It Works (Architecture)

```
Client connects via WebSocket
    ↓
Server creates conversation history (starts with system prompt)
    ↓
Client sends: "Hello"
    ↓
Server adds to history + sends to Ollama
    ↓
Ollama streams back token by token
    ↓
Server forwards each token to client via "token" messages
    ↓
When done, server adds full response to history, sends "complete"
    ↓
Client ready for next message
```

Each WebSocket connection has its own conversation history, so multiple clients won't interfere with each other.

## Health Check

Test the server is running:
```bash
curl http://localhost:3000/health
```

Response:
```json
{ "status": "ok", "model": "qwen2.5:7b", "ollama": "http://localhost:11434" }
```

## Troubleshooting

### "Cannot find module 'ws'"
You skipped `npm install`. Run it first.

### "Connection refused to localhost:11434"
Ollama isn't running. In a separate terminal, run `ollama serve` and leave it running.

### "Model not found: qwen2.5:7b"
The model wasn't downloaded. Run `ollama pull qwen2.5:7b` and wait for it to complete.

### Server starts but test client gets no response
Check the server logs. If it says "Ollama request failed", verify `OLLAMA_HOST` in `.env` matches where Ollama is actually running.

## Next Steps

Once this works end-to-end (text in → response streams back → conversation memory preserved):
- ✅ You're ready for **Stage 2** (add tool-calling for ordering)
- Each stage builds on this, so don't move forward until text-based chat works reliably

## Notes

- Responses will take a few seconds on a CPU without a GPU — this is normal and expected
- The model is running entirely locally, so no API keys or cloud accounts needed
- Conversation history is kept in memory only — if the server restarts, history is lost (we'll add persistence in later stages if needed)
