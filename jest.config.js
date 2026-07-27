module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'server.js',
    '!node_modules/**',
  ],
  testMatch: ['**/test/**/*.test.js'],
  verbose: true,
};
