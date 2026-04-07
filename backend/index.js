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
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.log("GET USER ERROR:", error);
    return null;
  }

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

    const userId = "user_"