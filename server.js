// server.js
const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const fs         = require('fs').promises;
const path       = require('path');

const app        = express();
const PORT       = 3000;
const DATA_DIR   = path.join(__dirname, 'data');
const WALLETS_FILE = path.join(DATA_DIR, 'wallets.json');

// Ensure data directory & wallets.json
async function initData() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(WALLETS_FILE);
  } catch {
    await fs.writeFile(WALLETS_FILE, '[]', 'utf8');
  }
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Load all wallets
app.get('/api/wallets', async (req, res) => {
  const raw = await fs.readFile(WALLETS_FILE, 'utf8');
  res.json(JSON.parse(raw));
});

// --- Save all wallets
app.post('/api/wallets', async (req, res) => {
  await fs.writeFile(WALLETS_FILE, JSON.stringify(req.body, null, 2), 'utf8');
  res.json({ status: 'ok' });
});

// --- Chat load
app.get('/api/chat/:wallet', async (req, res) => {
  const fn = path.join(DATA_DIR, `chat-${req.params.wallet}.json`);
  try {
    const raw = await fs.readFile(fn, 'utf8');
    res.json(JSON.parse(raw));
  } catch {
    res.json([]);
  }
});

// --- Chat save
app.post('/api/chat/:wallet', async (req, res) => {
  const fn = path.join(DATA_DIR, `chat-${req.params.wallet}.json`);
  await fs.writeFile(fn, JSON.stringify(req.body, null, 2), 'utf8');
  res.json({ status: 'saved' });
});

// --- Wallet check with artificial delay & sample data
app.post('/api/check/:wallet', async (req, res) => {
  const addr = req.params.wallet;
  // simulate delay
  await new Promise(r => setTimeout(r, 2000));
  const now = new Date().toISOString();
  const result = {
    address: addr,
    status:  'done',
    flag:    Math.random() < 0.5 ? 'red' : 'green',
    date:    now,
    summary: `Checked ${addr} at ${now}`,
    connected: [
      { address:'0xabc123', hop:1, prob:95, labels:['Mixer'],    flag:'red'   },
      { address:'0xdef456', hop:2, prob:70, labels:['Gambling'], flag:'green' }
    ],
    transactions: [
      { ts: Date.now() / 1000 | 0, value: Math.random() * 2 },
      { ts: Date.now() / 1000 | 0, value: Math.random() * 1 }
    ]
  };
  // update wallets.json
  const raw = await fs.readFile(WALLETS_FILE, 'utf8');
  const list = JSON.parse(raw).map(w =>
    w.address === addr
      ? { ...w, status: result.status, flag: result.flag, date: result.date, summary: result.summary, connected: result.connected }
      : w
  );
  await fs.writeFile(WALLETS_FILE, JSON.stringify(list, null, 2), 'utf8');

  res.json(result);
});

initData().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});