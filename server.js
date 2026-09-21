const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;
const GH_PAT = process.env.GH_PAT;
const OWNER = 'yasamarium';

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cloudgame-gateway', timestamp: new Date().toISOString() });
});

// Cache servers registry in memory
let cachedServers = [];
let lastCacheTime = 0;

function fetchLiveServers(callback) {
  const now = Date.now();
  if (now - lastCacheTime < 30000 && cachedServers.length > 0) {
    return callback(null, cachedServers);
  }

  const req = https.request({
    hostname: 'api.github.com',
    path: `/repos/${OWNER}/cloudgame-db-sessions/contents/data/servers.json`,
    headers: {
      'Authorization': `Bearer ${GH_PAT}`,
      'User-Agent': 'CloudGameGateway',
      'Accept': 'application/vnd.github+json'
    }
  }, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const fileData = JSON.parse(body);
        cachedServers = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));
        lastCacheTime = now;
        callback(null, cachedServers);
      } catch (err) {
        callback(err, cachedServers);
      }
    });
  });
  req.on('error', err => callback(err, cachedServers));
  req.end();
}

app.get('/api/games', (req, res) => {
  fetchLiveServers((err, servers) => {
    res.json({ success: true, games: servers });
  });
});

app.get('/api/games/:id/stream', (req, res) => {
  const gameId = req.params.id;
  fetchLiveServers((err, servers) => {
    const game = servers.find(s => s.id === gameId);
    if (game) {
      res.json({ success: true, game });
    } else {
      res.status(404).json({ success: false, message: 'Game not found' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`[Gateway Hub] Listening on port ${PORT}`);
});
