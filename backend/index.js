const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// всі місця (НЕ юзери, а саме місця)
let slots = [];

// налаштування площадок
const LEVELS = [
  { levels: 5, total: 62, lastLevel: 32, price: 0.5 },
  { levels: 4, total: 30, lastLevel: 16, price: 0.5 },
  { levels: 3, total: 14, lastLevel: 8, price: 0.5 },
  { levels: 2, total: 6,  lastLevel: 4, price: 0.5 },
  { levels: 5, total: 62, lastLevel: 32, price: 0.5 }
];

// 🔺 створення місця
function createSlot(userId, platform = 0) {
  return {
    id: uuidv4(),
    userId,
    platform,
    parentId: null,
    left: null,
    right: null,
    closed: false,
    earnings: 0
  };
}

// 🔍 знайти parent
function getNextParent(platform) {
  return slots.find(s =>
    s.platform === platform &&
    (!s.left || !s.right) &&
    !s.closed
  );
}

// 📊 підрахунок дітей
function countChildren(id) {
  let count = 0;

  function dfs(nodeId) {
    const node = slots.find(s => s.id === nodeId);
    if (!node) return;

    if (node.left) {
      count++;
      dfs(node.left);
    }
    if (node.right) {
      count++;
      dfs(node.right);
    }
  }

  dfs(id);
  return count;
}

// 💰 перевірка закриття
function checkClose(slot) {
  const config = LEVELS[slot.platform];
  const total = countChildren(slot.id);

  if (total >= config.total - 1 && !slot.closed) {
    slot.closed = true;

    const reward = config.lastLevel * config.price;

    console.log("🎉 CLOSED:", slot.userId, "earned:", reward);

    slot.earnings += reward;

    // 🔁 реінвест
    const newSlot = createSlot(slot.userId, slot.platform);
    placeSlot(newSlot);
  }
}

// ➕ поставити місце
function placeSlot(slot) {
  const parent = getNextParent(slot.platform);

  if (!parent) {
    slots.push(slot);
    console.log("👑 FIRST SLOT", slot.userId);
    return;
  }

  console.log("💰 Payment goes to:", parent.userId);

  if (!parent.left) {
    parent.left = slot.id;
  } else {
    parent.right = slot.id;
  }

  slot.parentId = parent.id;
  slots.push(slot);

  // перевіряємо закриття у всіх вверх по ланцюгу
  let current = parent;
  while (current) {
    checkClose(current);
    current = slots.find(s => s.id === current.parentId);
  }
}

// 🚀 РЕЄСТРАЦІЯ (1.5 TON = 3 місця)
app.post('/register', (req, res) => {
  const userId = req.body?.userId;

  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  // 🔥 створюємо 3 АКТИВНІ місця
  const slot1 = createSlot(userId + "_1");
  const slot2 = createSlot(userId + "_2");
  const slot3 = createSlot(userId + "_3");

  // 🔥 ВСІ 3 ЙДУТЬ В СИСТЕМУ (ВАЖЛИВО)
  placeSlot(slot1);
  placeSlot(slot2);
  placeSlot(slot3);

  res.json({
    message: "User entered with 3 slots (1.5 TON)",
    slots: [slot1, slot2, slot3]
  });
});

// 📊 всі дані
app.get('/slots', (req, res) => {
  res.json(slots);
});

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});