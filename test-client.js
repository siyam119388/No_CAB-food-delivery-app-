const WebSocket = require('ws');
const readline = require('readline');

const ws = new WebSocket('ws://localhost:3000/agent-session');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

ws.on('open', () => {
  console.log('Connected to server');
  console.log('Type your messages below. Press Ctrl+C to exit.\n');
  promptUser();
});

ws.on('message', (data) => {
  const message = JSON.parse(data);

  switch (message.type) {
  case 'ready':
    console.log(`\n[Server] ${message.message}\n`);
    break;
  case 'token':
    process.stdout.write(message.content);
    break;
  case 'complete':
    console.log('\n');
    promptUser();
    break;
  case 'error':
    console.error(`\n[Error] ${message.message}\n`);
    promptUser();
    break;
  default:
    console.log(`\n[Server] ${JSON.stringify(message)}\n`);
    promptUser();
  }
});

ws.on('close', () => {
  console.log('Disconnected from server');
  process.exit(0);
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error.message);
  process.exit(1);
});

function promptUser() {
  rl.question('You: ', (input) => {
    if (input.trim()) {
      ws.send(input);
    } else {
      promptUser();
    }
  });
}
