module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:5173'],
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'ready in',
      startServerReadyTimeout: 20000,
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', {minScore: 0.9}],
        'categories:best-practices': ['error', {minScore: 0.8}],
        'categories:performance': ['warn', {minScore: 0.7}],
        'categories:seo': ['error', {minScore: 0.9}],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};