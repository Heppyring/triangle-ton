const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 ENV
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

// ==========================
// 🔥 FRACTALS
// ==========================
const FRACTALS = [
  { id: 0, name: "Fractal D1", total: 62, reward: 16 },
  { id: 1, name: "Fractal D2", total: 30, reward: 102.4 },
  { id: 2, name: "Fractal D3", total: 14, reward: 400 },
  { id: 3, name: "Fractal D4", total: 6, reward: 824.4 },
  { id: 4, name: "Fractal DX", total: 62, reward: 13843.2 }
];

// ==========================
// HELPERS
// ==========================

function generateToken(user) {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

async function getUserByEmail(email) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  return data;
}

// ==========================
// 🔺 BFS (РЕАЛЬНА СТРУКТУРА)
// ==========================

async function getNextParentInTree(referrerId, platform) {
  const { data: allSlots } = await supabase
    .from('slots')
    .select('*')
    .eq('platform', platform)
    .eq('closed', false);

  if (!allSlots || allSlots.length === 0) return null;

  // 🔥 знаходимо ROOT по першому слоту користувача
  const root = allSlots.find(
    s => s.user_id === `${referrerId}_1`
  );

  if (!root) return null;

  const queue = [root];

  while (queue.length) {
    const current = queue.shift();

    // ✅ є місце → беремо
    if (!current.left_id || !current.right_id) {
      return current;
    }

    // 👉 рух по дереву
    const left = allSlots.find(s => s.id === current.left_id);
    const right = allSlots.find(s => s.id === current.right_id);

    if (left) queue.push(left);
    if (right) queue.push(right);
  }

  return null;
}

// ==========================
// 🌍 GLOBAL FALLBACK
// ==========================

async function getNextParent(platform) {
  const { data } = await supabase
    .from('slots')
    .select('*')
    .eq('platform', platform)
    .eq('closed', false);

  return data.find(s => !s.left_id || !s.right_id) || null;
}

// ==========================
// 👶 COUNT CHILDREN
// ==========================

async function countChildren(slotId) {
  const { data } = await supabase.from('slots').select('*');

  let count = 0;

  function dfs(id) {
    const node = data.find(s => s.id === id);
    if (!node) return;

    if (node.left_id) {
      count++;
      dfs(node.left_id);
    }
    if (node.right_id) {
      count++;
      dfs(node.right_id);
    }
  }

  dfs(slotId);
  return count;
}

// ==========================
// 💰 CLOSE + REINVEST
// ==========================

async function checkClose(slot) {
  const config = FRACTALS[slot.platform];
  if (!config || slot.closed) return;

  const total = await countChildren(slot.id);

  if (total >= config.total - 1) {
    console.log("🎉 CLOSED:", slot.user_id);

    await supabase
      .from('slots')
      .update({
        closed: true,
        earnings: slot.earnings + config.reward
      })
      .eq('id', slot.id);

    // 🔁 реінвест
    const baseUser = slot.user_id.split('_').slice(0, 2).join('_');

    const newSlot = {
      user_id: slot.user_id,
      platform: slot.platform,
      parent_id: null,
      left_id: null,
      right_id: null,
      closed: false,
      earnings: 0
    };

    await placeSlot(newSlot, baseUser);
  }
}

// ==========================
// ➕ PLACE SLOT
// ==========================

async function placeSlot(slot, referrerId = null) {
  let parent = null;

  // 👉 1. своя структура
  if (referrerId) {
    parent = await getNextParentInTree(referrerId, slot.platform);
  }

  // 👉 2. fallback
  if (!parent) {
    parent = await getNextParent(slot.platform);
  }

  // 👉 3. якщо пусто
  if (!parent) {
    const { data } = await supabase
      .from('slots')
      .insert([slot])
      .select()
      .single();

    console.log("👑 FIRST SLOT:", slot.user_id);
    return data;
  }

  console.log("💸 Payment →", parent.user_id);

  const field = !parent.left_id ? 'left_id' : 'right_id';

  await supabase
    .from('slots')
    .update({ [field]: slot.id })
    .eq('id', parent.id);

  slot.parent_id = parent.id;

  const { data: newSlot } = await supabase
    .from('slots')
    .insert([slot])
    .select()
    .single();

  // 🔁 перевірка вверх
  let current = parent;

  while (current) {
    await checkClose(current);

    if (!current.parent_id) break;

    const { data } = await supabase
      .from('slots')
      .select('*')
      .eq('id', current.parent_id)
      .single();

    current = data;
  }

  return newSlot;
}

// ==========================
// 🚀 REGISTER (ТРІАДА)
// ==========================

app.post('/register', async (req, res) => {
  try {
    const { userId, referrerId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    const slots = [];

    for (let i = 1; i <= 3; i++) {
      const slot = {
        user_id: `${userId}_${i}`,
        platform: 0,
        parent_id: null,
        left_id: null,
        right_id: null,
        closed: false,
        earnings: 0
      };

      const created = await placeSlot(slot, referrerId);
      if (created) slots.push(created);
    }

    res.json({ message: "Triad created", slots });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'register error' });
  }
});

// ==========================
// 📊 SLOTS
// ==========================

app.get('/slots', async (req, res) => {
  const { data } = await supabase.from('slots').select('*');

  res.json(
    data.map(s => ({
      ...s,
      fractal: FRACTALS[s.platform].name
    }))
  );
});

// ==========================
// AUTH
// ==========================

app.post('/auth/register', async (req, res) => {
  const { email, password, referrer_id } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const { data } = await supabase
    .from('users')
    .insert([{
      id: "user_" + Date.now(),
      email,
      password: hash,
      referrer_id
    }])
    .select()
    .single();

  res.json({ user: data, token: generateToken(data) });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await getUserByEmail(email);

  if (!user) return res.status(400).json({ error: 'not found' });

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) return res.status(400).json({ error: 'wrong pass' });

  res.json({ user, token: generateToken(user) });
});

// ==========================
// TEST
// ==========================

app.get('/', (req, res) => {
  res.send("API WORKING 🚀");
});

// ==========================
// PORT
// ==========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});