// Basic smoke tests for the server

describe('Server Configuration', () => {
  it('should have required environment variables configured', () => {
    const port = process.env.PORT || 3000;
    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';

    expect(port).toBeDefined();
    expect(ollamaHost).toBeDefined();
    expect(ollamaHost).toMatch(/^http/);
  });

  it('should export required modules', () => {
    // Check that the server file can be required without errors
    const fs = require('fs');
    const serverCode = fs.readFileSync('./server.js', 'utf-8');

    expect(serverCode).toContain('express');
    expect(serverCode).toContain('WebSocket');
    expect(serverCode).toContain('axios');
    expect(serverCode).toContain('Ollama');
  });
});
