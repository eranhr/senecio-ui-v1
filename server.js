const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const fs         = require('fs').promises;
const path       = require('path');

const app         = express();
const PORT        = 3000;
const DATA_DIR    = path.join(__dirname, 'data');
const WALLETS_FILE = path.join(DATA_DIR, 'wallets.json');

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

// Load wallets
app.get('/api/wallets', async (req,res) => {
  const raw = await fs.readFile(WALLETS_FILE,'utf8');
  res.json(JSON.parse(raw));
});

// Save wallets
app.post('/api/wallets', async (req,res) => {
  await fs.writeFile(WALLETS_FILE, JSON.stringify(req.body,null,2),'utf8');
  res.json({ status:'ok' });
});

// Load chat
app.get('/api/chat/:wallet', async (req,res) => {
  const fn = path.join(DATA_DIR, `chat-${req.params.wallet}.json`);
  try {
    const raw = await fs.readFile(fn,'utf8');
    res.json(JSON.parse(raw));
  } catch {
    res.json([]);
  }
});

// Save chat
app.post('/api/chat/:wallet', async (req,res) => {
  const fn = path.join(DATA_DIR, `chat-${req.params.wallet}.json`);
  await fs.writeFile(fn, JSON.stringify(req.body,null,2),'utf8');
  res.json({ status:'saved' });
});

// Wallet check stub with delay + sample data
app.post('/api/check/:wallet', async (req,res) => {
  const addr = req.params.wallet;
  // simulate processing delay
  await new Promise(r=>setTimeout(r,2000));
  const now = new Date().toISOString();

  const result = {
    address: addr,
    status:  'done',
    flag:    Math.random()<0.5?'red':'green',
    date:    now,
    summary: `Checked ${addr} at ${now}`,
    categories: ['Mixer','High-Risk'],
    potentialCategories: [
      { category:'Gambling', prob:0.72 },
      { category:'Crowd Funding', prob:0.65 }
    ],
    behavesLike: [
      { address:'0xAAA111', prob:0.89, categories:['Mixer'] },
      { address:'0xBBB222', prob:0.77, categories:['Exchange','High-Risk'] }
    ],
    connected: [
      { address:'0xabc123', hop:1, prob:95, labels:['Mixer'], flag:'red' },
      { address:'0xdef456', hop:2, prob:70, labels:['Gambling'], flag:'green' }
    ],
    transactions: [
      { ts: Math.floor(Date.now()/1000) - 3600, value:1.23 },
      { ts: Math.floor(Date.now()/1000),       value:0.78 }
    ]
  };

  // Merge into wallets.json
  const raw = await fs.readFile(WALLETS_FILE,'utf8');
  const list = JSON.parse(raw).map(w =>
    w.address === addr
      ? { ...w,
          status: result.status,
          flag:   result.flag,
          date:   result.date,
          summary:result.summary,
          categories: result.categories,
          potentialCategories: result.potentialCategories,
          behavesLike: result.behavesLike,
          connected: result.connected,
          transactions: result.transactions
        }
      : w
  );
  await fs.writeFile(WALLETS_FILE, JSON.stringify(list,null,2),'utf8');

  res.json(result);
});

initData().then(() => {
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
});