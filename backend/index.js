const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================
// 🔐 CONFIG
// ==========================

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || "change_me";

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
// 🛠 HELPERS
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
// 🔺 TRIAD REGISTER
// ==========================

app.post('/api/register-triad', async (req, res) => {
  try {
    const { userId, platformId = 0 } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    // ✅ Захист від дублікатів
    const { data: existing } = await supabase
      .from('slots')
      .select('id')
      .like('user_id', `${userId}_%`);

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: "Triad already exists" });
    }

    const slots = [];

    for (let i = 1; i <= 3; i++) {
      const { data, error } = await supabase.rpc('join_fractal', {
        p_user_id: `${userId}_${i}`,
        p_platform: platformId
      });

      if (error) throw error;

      // 🔥 ВОТ ГОЛОВНЕ (виплати + реінвест)
      await supabase.rpc('check_and_close', {
        p_slot_id: data.id
      });

      slots.push(data);
    }

    res.json({
      message: "Triad created",
      slots
    });

  } catch (err) {
    console.error("TRIAD ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// 📊 GET SLOTS
// ==========================

app.get('/slots', async (req, res) => {
  try {
    const { data, error } = await supabase.from('slots').select('*');

    if (error) throw error;

    res.json(
      data.map(s => ({
        ...s,
        fractal: FRACTALS[s.platform]?.name || "Unknown"
      }))
    );

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// 🔐 AUTH
// ==========================

app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, referrer_id } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: "user_" + Date.now(),
        email,
        password: hash,
        referrer_id
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ user: data, token: generateToken(data) });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(400).json({ error: 'not found' });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ error: 'wrong pass' });
    }

    res.json({ user, token: generateToken(user) });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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