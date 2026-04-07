const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 ENV
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const JWT_SECRET = "super_secret_key"; // 🔥 потім змінимо

// ==========================
// 🔺 HELPERS
// ==========================

function generateToken(user) {
  return jwt.sign(
    { id: user.id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function getUserByEmail(email) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  return data;
}

// ==========================
// 🚀 REGISTER (EMAIL)
// ==========================

app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, referrer_id } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email & password required' });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hash = await bcrypt.hash(password, 10);

    const userId = "user_" + Date.now();

    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email,
        password: hash,
        referrer_id
      }])
      .select()
      .single();

    if (error) throw error;

    const token = generateToken(data);

    res.json({ user: data, token });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'register error' });
  }
});

// ==========================
// 🔑 LOGIN
// ==========================

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ error: 'Wrong password' });
    }

    const token = generateToken(user);

    res.json({ user, token });

  } catch (err) {
    res.status(500).json({ error: 'login error' });
  }
});

// ==========================
// 👤 GET ME
// ==========================

app.get('/auth/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;

    if (!auth) return res.status(401).json({ error: 'No token' });

    const token = auth.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    res.json(data);

  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ==========================
// 🧪 TEST
// ==========================

app.get('/', (req, res) => {
  res.send("API WORKING");
});

app.listen(3000, () => {
  console.log("🚀 Server running");
});