const express = require('express');
const WebSocket = require('ws');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODEL = 'qwen2.5:7b';

// Create HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/agent-session`);
  console.log(`Ollama host: ${OLLAMA_HOST}`);
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store conversations per connection
const conversationStore = new Map();

wss.on('connection', (ws) => {
  const connectionId = Math.random().toString(36).substring(7);
  console.log(`[${connectionId}] Client connected`);

  // Initialize conversation history for this connection
  conversationStore.set(connectionId, [
    {
      role: 'system',
      content: 'You are a helpful assistant for the NoCap food delivery app. Be concise and friendly.',
    },
  ]);

  ws.on('message', async (message) => {
    try {
      const userMessage = message.toString('utf-8');
      console.log(`[${connectionId}] User: ${userMessage}`);

      // Get conversation history
      const conversationHistory = conversationStore.get(connectionId);
      conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      // Stream response from Ollama
      await streamOllamaResponse(ws, connectionId, conversationHistory);

      // Note: Assistant message is added by streamOllamaResponse
    } catch (error) {
      console.error(`[${connectionId}] Error:`, error.message);
      ws.send(JSON.stringify({
        type: 'error',
        message: `Error: ${error.message}`,
      }));
    }
  });

  ws.on('close', () => {
    console.log(`[${connectionId}] Client disconnected`);
    conversationStore.delete(connectionId);
  });

  ws.on('error', (error) => {
    console.error(`[${connectionId}] WebSocket error:`, error);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'ready',
    message: 'Connected to NoCap Voice Agent. Send a text message to start chatting.',
  }));
});

async function streamOllamaResponse(ws, connectionId, conversationHistory) {
  const conversationStore_ref = conversationStore;
  let fullResponse = '';

  try {
    const response = await axios.post(
      `${OLLAMA_HOST}/api/chat`,
      {
        model: MODEL,
        messages: conversationHistory,
        stream: true,
      },
      {
        responseType: 'stream',
        timeout: 180000,
      }
    );

    response.data.on('data', (chunk) => {
      try {
        const lines = chunk.toString().split('\n');
        lines.forEach((line) => {
          if (line.trim()) {
            const json = JSON.parse(line);
            if (json.message && json.message.content) {
              const content = json.message.content;
              fullResponse += content;

              // Send streaming text chunk to client
              ws.send(JSON.stringify({
                type: 'token',
                content,
              }));
            }
          }
        });
      } catch (error) {
        console.error(`[${connectionId}] Error parsing stream:`, error.message);
      }
    });

    response.data.on('end', () => {
      // Add full response to conversation history
      const history = conversationStore_ref.get(connectionId);
      if (history) {
        history.push({
          role: 'assistant',
          content: fullResponse,
        });
      }

      // Send completion signal
      ws.send(JSON.stringify({
        type: 'complete',
        message: 'Response complete',
      }));

      console.log(`[${connectionId}] Assistant: ${fullResponse.substring(0, 100)}...`);
    });

    response.data.on('error', (error) => {
      console.error(`[${connectionId}] Stream error:`, error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Stream error occurred',
      }));
    });
  } catch (error) {
    console.error(`[${connectionId}] Ollama request failed:`, error.message);
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', model: MODEL, ollama: OLLAMA_HOST });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.close();
    }
  });
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
