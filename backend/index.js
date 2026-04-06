const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors());
app.use(express.json());

// 🔑 SUPABASE
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🔥 ПЛОЩАДКИ (ВСІ)
const LEVELS = [
  { levels: 5, total: 62, lastLevel: 32, price: 0.5 },
  { levels: 4, total: 30, lastLevel: 16, price: 6.4 },
  { levels: 3, total: 14, lastLevel: 8,  price: 50 },
  { levels: 2, total: 6,  lastLevel: 4,  price: 206.1 },
  { levels: 5, total: 62, lastLevel: 32, price: 432.6 }
];

// 🔹 helper
function getBaseUserId(userId) {
  return userId.split('_').slice(0, 2).join('_');
}

// 🔹 створення слота
function createSlot(userId, platform = 0) {
  return {
    user_id: userId,
    platform,
    parent_id: null,
    left_id: null,
    right_id: null,
    closed: false,
    earnings: 0
  };
}

// 🔍 отримати користувача
async function getUser(userId) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  return data;
}

// 🔍 BFS в структурі реферала
async function getNextParentInTree(referrerId, platform) {
  const { data: allSlots } = await supabase
    .from('slots')
    .select('*');

  const queue = allSlots.filter(s =>
    getBaseUserId(s.user_id) === referrerId
  );

  while (queue.length > 0) {
    const current = queue.shift();

    if (
      current.platform === platform &&
      (!current.left_id || !current.right_id) &&
      !current.closed
    ) {
      return current;
    }

    if (current.left_id) {
      const left = allSlots.find(s => s.id === current.left_id);
      if (left) queue.push(left);
    }

    if (current.right_id) {
      const right = allSlots.find(s => s.id === current.right_id);
      if (right) queue.push(right);
    }
  }

  return null;
}

// 🔍 fallback (глобальна черга)
async function getNextParent(platform) {
  const { data } = await supabase
    .from('slots')
    .select('*')
    .eq('platform', platform)
    .eq('closed', false);

  return data.find(s => !s.left_id || !s.right_id) || null;
}

// 📊 підрахунок дітей
async function countChildren(id) {
  const { data: allSlots } = await supabase
    .from('slots')
    .select('*');

  let count = 0;

  function dfs(nodeId) {
    const node = allSlots.find(s => s.id === nodeId);
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

  dfs(id);
  return count;
}

// 💰 закриття + реінвест + перехід вверх
async function checkClose(slot) {
  const config = LEVELS[slot.platform];
  if (!config) return;

  const total = await countChildren(slot.id);

  if (total >= config.total - 1 && !slot.closed) {
    const reward = config.lastLevel * config.price;

    console.log("🎉 CLOSED:", slot.user_id, "| platform:", slot.platform);
    console.log("💰 EARNED:", reward);

    await supabase
      .from('slots')
      .update({
        closed: true,
        earnings: slot.earnings + reward
      })
      .eq('id', slot.id);

    const baseUser = getBaseUserId(slot.user_id);
    const user = await getUser(baseUser);
    const ref = user?.referrer_id || null;

    // 🔁 РЕІНВЕСТ В ТУ Ж ПЛОЩАДКУ
    const reinvest = createSlot(slot.user_id, slot.platform);
    await placeSlot(reinvest, ref);

    // 🔝 ПЕРЕХІД НА ВИЩУ ПЛОЩАДКУ
    if (slot.platform + 1 < LEVELS.length) {
      const upgrade = createSlot(slot.user_id, slot.platform + 1);
      await placeSlot(upgrade, ref);
    }
  }
}

// ➕ вставка
async function placeSlot(slot, referrerId = null) {
  let parent = null;

  if (referrerId) {
    parent = await getNextParentInTree(referrerId, slot.platform);
  }

  if (!parent) {
    parent = await getNextParent(slot.platform);
  }

  const { data: inserted } = await supabase
    .from('slots')
    .insert([slot])
    .select();

  const newSlot = inserted[0];

  if (!parent) {
    console.log("👑 FIRST SLOT:", slot.user_id);
    return newSlot;
  }

  console.log("💸 Payment →", parent.user_id);

  // оновлюємо parent
  if (!parent.left_id) {
    await supabase
      .from('slots')
      .update({ left_id: newSlot.id })
      .eq('id', parent.id);
  } else {
    await supabase
      .from('slots')
      .update({ right_id: newSlot.id })
      .eq('id', parent.id);
  }

  // записуємо parent_id
  await supabase
    .from('slots')
    .update({ parent_id: parent.id })
    .eq('id', newSlot.id);

  // перевірка вверх
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

// 🚀 РЕЄСТРАЦІЯ
app.post('/register', async (req, res) => {
  try {
    const userId = req.body?.userId;
    const referrerId = req.body?.referrerId || null;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    // 🔥 створюємо юзера
    await supabase.from('users').insert([
      {
        id: userId,
        referrer_id: referrerId
      }
    ]);

    // 🔥 3 місця
    const s1 = await placeSlot(createSlot(userId + "_1", 0), referrerId);
    const s2 = await placeSlot(createSlot(userId + "_2", 0), referrerId);
    const s3 = await placeSlot(createSlot(userId + "_3", 0), referrerId);

    res.json({
      message: "User registered",
      slots: [s1, s2, s3]
    });

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
});

// 📊 всі слоти
app.get('/slots', async (req, res) => {
  const { data } = await supabase.from('slots').select('*');
  res.json(data);
});

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});