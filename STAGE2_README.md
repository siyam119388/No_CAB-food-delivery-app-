# Stage 2: Tool-Calling & Ordering

## What's New

The backend now supports **tool-calling** — the agent can use functions to perform actions:

### Available Tools

1. **`search_menu(query, verified_only)`** — Search menu items
   - Query: "biryani", "vegetarian", "taj mahal", etc.
   - Returns: Matching items with prices and restaurant names
   - Example: "show me some biryani" → agent calls `search_menu("biryani")`

2. **`add_item(cart_id, item_id, quantity)`** — Add to cart
   - Maintains cart per session
   - Returns: Updated cart with total
   - Example: "add the first one" → agent calls `add_item(...)`

3. **`prepare_checkout(cart_id, user_confirmed)`** — Prepare order
   - Only succeeds if `user_confirmed=true`
   - Creates pending order (no payment yet)
   - Returns: Order ID and confirmation message
   - Example: User says "yes" to confirm → agent calls `prepare_checkout(..., true)`

## How It Works

1. **User sends message** → WebSocket → Server
2. **Server calls Ollama** with conversation history + tool schemas
3. **Ollama decides** whether to call a tool or just respond
4. **Server executes tool** if needed, adds result to conversation
5. **Process repeats** until Ollama finishes thinking
6. **Response streams back** to client as text + tool results

## Test Flow

### Text Testing (test-client.js)
```bash
node test-client.js
```

Type these messages in order:
1. **"show me some biryani"**
   - Agent searches menu → returns biryani options
   - You see: Biryani item with price, restaurant, verification status

2. **"add the first one"**
   - Agent adds item to cart → returns updated cart
   - You see: Cart total and items

3. **"what's my total?"**
   - Agent tells you the total
   - (No tool call needed — just conversation)

4. **"place the order"**
   - Agent asks for confirmation
   - Say **"yes"** to confirm
   - Agent calls `prepare_checkout` with `user_confirmed=true`
   - You see: Order ID and "tap Pay Now" message

### What the Agent Does

For **"show me some biryani"**:
```
Agent thinks: User wants to search for food
→ Calls: search_menu("biryani", false)
← Returns: 2 items (Biryani from Taj Mahal, verified)
→ Tells user: "I found biryani at Taj Mahal for 250 rupees"
```

For **"add the first one"**:
```
Agent thinks: User wants to add first search result
→ Calls: add_item(cart_id, 1, 1)
← Returns: {items: [...], total: 250}
→ Tells user: "Added biryani. Your cart: 1 item, total 250"
```

## Mock Data

8 pre-loaded menu items from 5 restaurants:
- **Taj Mahal** (verified): Biryani, Tikka, Naan, Korma, Samosa
- **Fast Bites** (unverified): Burger
- **Pizza House** (verified): Pizza Margherita
- **Pita Palace** (verified): Falafel Wrap

Search works on: item name, restaurant name, or description.

## Confirmation Model (Important)

**Voice confirmation** is built-in:
- Agent asks user to confirm order
- User responds "yes" or "no"
- Agent only calls `prepare_checkout` if user says yes
- This prevents accidental orders from mishearing

**Payment** is separate:
- `prepare_checkout` creates pending order (no money moves)
- Real payment happens via separate tap-on-screen step (Stage 5+)

## System Prompt

The agent is guided by:
```
1. Search for restaurants/menu items
2. Add items to cart
3. Confirm order before checkout
4. Show prices and restaurant names
5. Use tool calls to perform actions
6. Restate cart after each change
```

## Files Modified

- `server.js` — Added tool schemas, handlers, and tool-calling logic
- `STAGE2_README.md` — This documentation

## Testing with WebSocket

If you prefer raw WebSocket testing with a tool like `websocat`:
```bash
websocat ws://localhost:3000/agent-session
```

Messages look like:
```json
{"type":"token","content":"I'll search for biryani"}
{"type":"tool_result","tool":"search_menu","result":{...}}
{"type":"complete","message":"Response complete"}
```

## Next Steps

- **Stage 3:** Add speech-to-text (Whisper)
- **Stage 4:** Add text-to-speech (edge-tts)
- **Stage 5:** Build Flutter test app with UI

## Troubleshooting

### Tools not being called
- Check server logs for errors
- Verify tool schemas are valid JSON
- Make sure Ollama model supports tool-calling (qwen2.5:7b does)

### Tool returns empty results
- The mock data has only 8 items
- Search is case-insensitive
- Try: "biryani", "taj", "pizza", etc.

### Order not preparing
- User must explicitly confirm ("yes", "ok", "place it", etc.)
- Agent will ask for confirmation before calling tool
- Tool only succeeds if `user_confirmed=true`
