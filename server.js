const express = require('express');
const WebSocket = require('ws');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODEL = 'qwen2.5:7b';

// Mock data for restaurants and menu
const mockMenuItems = [
  { id: 1, name: 'Biryani', price: 250, restaurant: 'Taj Mahal', verified: true, desc: 'Fragrant basmati rice with meat' },
  { id: 2, name: 'Chicken Tikka', price: 180, restaurant: 'Taj Mahal', verified: true, desc: 'Marinated chicken pieces' },
  { id: 3, name: 'Naan', price: 40, restaurant: 'Taj Mahal', verified: true, desc: 'Freshly baked bread' },
  { id: 4, name: 'Burger', price: 150, restaurant: 'Fast Bites', verified: false, desc: 'Classic beef burger' },
  { id: 5, name: 'Pizza Margherita', price: 320, restaurant: 'Pizza House', verified: true, desc: 'Fresh mozzarella and basil' },
  { id: 6, name: 'Falafel Wrap', price: 120, restaurant: 'Pita Palace', verified: true, desc: 'Vegetarian chickpea wrap' },
  { id: 7, name: 'Mutton Korma', price: 280, restaurant: 'Taj Mahal', verified: true, desc: 'Creamy mutton curry' },
  { id: 8, name: 'Samosa', price: 60, restaurant: 'Taj Mahal', verified: true, desc: 'Crispy potato pastry' },
];

// Store conversations and carts per connection
const conversationStore = new Map();
const cartStore = new Map();

// Tool schemas for Ollama
const toolSchemas = [
  {
    name: 'search_menu',
    description: 'Search for menu items by query (name, restaurant, or description). Returns matching items with prices and verification status.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "biryani", "vegetarian", "taj mahal")',
        },
        verified_only: {
          type: 'boolean',
          description: 'If true, only return verified restaurants',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'add_item',
    description: 'Add an item to the cart. Returns updated cart state.',
    parameters: {
      type: 'object',
      properties: {
        cart_id: {
          type: 'string',
          description: 'Cart ID for this session',
        },
        item_id: {
          type: 'integer',
          description: 'Menu item ID',
        },
        quantity: {
          type: 'integer',
          description: 'Quantity to add',
        },
      },
      required: ['cart_id', 'item_id', 'quantity'],
    },
  },
  {
    name: 'prepare_checkout',
    description: 'Prepare order for checkout (creates pending order). Only succeeds if user_confirmed is true.',
    parameters: {
      type: 'object',
      properties: {
        cart_id: {
          type: 'string',
          description: 'Cart ID',
        },
        user_confirmed: {
          type: 'boolean',
          description: 'User must confirm via voice before this succeeds',
        },
      },
      required: ['cart_id', 'user_confirmed'],
    },
  },
];

const SYSTEM_PROMPT = `You are a helpful voice assistant for NoCap food delivery. Your role is to help users order food by:
1. Searching for restaurants and menu items
2. Adding items to their cart
3. Preparing orders for checkout

Guidelines:
- Always restate the full cart and total after any change
- Before calling prepare_checkout, ask the user to confirm the cart total
- When the user confirms, call prepare_checkout with user_confirmed=true
- Never make assumptions about quantities; always ask if unclear
- Be friendly, concise, and helpful
- Use tool calls to perform actions (search_menu, add_item, prepare_checkout)
- Always show prices and restaurant names clearly`;

// Create HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/agent-session`);
  console.log(`Ollama host: ${OLLAMA_HOST}`);
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  const connectionId = Math.random().toString(36).substring(7);
  const cartId = `cart_${connectionId}`;
  console.log(`[${connectionId}] Client connected`);

  // Initialize conversation history for this connection
  conversationStore.set(connectionId, [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
  ]);

  // Initialize cart
  cartStore.set(cartId, {
    items: [],
    total: 0,
  });

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

      // Stream response from Ollama with tool support
      await streamOllamaResponse(ws, connectionId, conversationHistory, cartId);

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
    cartStore.delete(cartId);
  });

  ws.on('error', (error) => {
    console.error(`[${connectionId}] WebSocket error:`, error);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'ready',
    message: 'Connected to NoCap Voice Agent. You can search for food, add items to cart, and place orders. Try saying "show me some biryani" or "search for vegetarian options".',
  }));
});

// Tool handler functions
function handleSearchMenu(query, verified_only = false) {
  const queryLower = query.toLowerCase();
  let results = mockMenuItems.filter(item =>
    item.name.toLowerCase().includes(queryLower) ||
    item.restaurant.toLowerCase().includes(queryLower) ||
    item.desc.toLowerCase().includes(queryLower)
  );

  if (verified_only) {
    results = results.filter(item => item.verified);
  }

  return {
    success: true,
    results: results.map(item => ({
      id: item.id,
      name: item.name,
      restaurant: item.restaurant,
      price: item.price,
      verified: item.verified,
      description: item.desc,
    })),
    count: results.length,
  };
}

function handleAddItem(cartId, itemId, quantity) {
  const item = mockMenuItems.find(i => i.id === itemId);
  if (!item) {
    return { success: false, error: `Item ${itemId} not found` };
  }

  const cart = cartStore.get(cartId);
  if (!cart) {
    return { success: false, error: 'Cart not found' };
  }

  // Check if item already in cart
  const existingItem = cart.items.find(i => i.id === itemId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      id: item.id,
      name: item.name,
      restaurant: item.restaurant,
      price: item.price,
      quantity,
    });
  }

  cart.total = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return {
    success: true,
    cart: {
      items: cart.items,
      total: cart.total,
      itemCount: cart.items.length,
    },
  };
}

function handlePrepareCheckout(cartId, userConfirmed) {
  const cart = cartStore.get(cartId);
  if (!cart) {
    return { success: false, error: 'Cart not found' };
  }

  if (!userConfirmed) {
    return {
      success: false,
      error: 'User confirmation required. Please ask user to confirm the cart and total.',
    };
  }

  if (cart.items.length === 0) {
    return { success: false, error: 'Cart is empty' };
  }

  const orderId = `order_${Date.now()}`;
  return {
    success: true,
    orderId,
    message: 'Order ready for payment. Please tap "Pay Now" to complete payment.',
    orderDetails: {
      id: orderId,
      items: cart.items,
      total: cart.total,
      status: 'awaiting_payment',
    },
  };
}

function executeTool(name, args, cartId) {
  console.log(`Executing tool: ${name}`, args);

  switch (name) {
  case 'search_menu':
    return handleSearchMenu(args.query, args.verified_only);
  case 'add_item':
    return handleAddItem(args.cart_id || cartId, args.item_id, args.quantity);
  case 'prepare_checkout':
    return handlePrepareCheckout(args.cart_id || cartId, args.user_confirmed);
  default:
    return { success: false, error: `Unknown tool: ${name}` };
  }
}

async function streamOllamaResponse(ws, connectionId, conversationHistory, cartId) {
  const conversationStore_ref = conversationStore;
  let fullResponse = '';
  let toolCalls = [];

  try {
    const response = await axios.post(
      `${OLLAMA_HOST}/api/chat`,
      {
        model: MODEL,
        messages: conversationHistory,
        tools: toolSchemas,
        stream: true,
      },
      {
        responseType: 'stream',
        timeout: 180000,
      }
    );

    let buffer = '';

    response.data.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');

      for (let i = 0; i < lines.length - 1; i++) {
        try {
          const json = JSON.parse(lines[i]);
          if (json.message) {
            if (json.message.content) {
              fullResponse += json.message.content;
              ws.send(JSON.stringify({
                type: 'token',
                content: json.message.content,
              }));
            }
            if (json.message.tool_calls) {
              toolCalls = json.message.tool_calls;
            }
          }
        } catch (error) {
          // Ignore parse errors, might be incomplete line
        }
      }
      buffer = lines[lines.length - 1];
    });

    response.data.on('end', () => {
      // Parse any remaining buffer
      if (buffer.trim()) {
        try {
          const json = JSON.parse(buffer);
          if (json.message) {
            if (json.message.content) {
              fullResponse += json.message.content;
              ws.send(JSON.stringify({
                type: 'token',
                content: json.message.content,
              }));
            }
            if (json.message.tool_calls) {
              toolCalls = json.message.tool_calls;
            }
          }
        } catch (error) {
          // Ignore
        }
      }

      const history = conversationStore_ref.get(connectionId);
      if (history) {
        // Add assistant response with tool calls if any
        const assistantMsg = { role: 'assistant', content: fullResponse };
        if (toolCalls && toolCalls.length > 0) {
          assistantMsg.tool_calls = toolCalls;
        }
        history.push(assistantMsg);

        // Execute tools and add results to history
        if (toolCalls && toolCalls.length > 0) {
          toolCalls.forEach(toolCall => {
            const result = executeTool(toolCall.function.name, toolCall.function.arguments, cartId);
            history.push({
              role: 'tool',
              content: JSON.stringify(result),
              tool_call_id: toolCall.id,
            });

            // Send tool result to client
            ws.send(JSON.stringify({
              type: 'tool_result',
              tool: toolCall.function.name,
              result,
            }));
          });
        }
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
