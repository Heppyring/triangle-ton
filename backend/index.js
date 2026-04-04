const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

let slots = [];

// 🔥 ПЛОЩАДКИ
const LEVELS = [
  { levels: 5, total: 62, lastLevel: 32, price: 0.5 },
  { levels: 4, total: 30, lastLevel: 16, price: 6.4 },
  { levels: 3, total: 14, lastLevel: 8,  price: 50 },
  { levels: 2, total: 6,  lastLevel: 4,  price: 206.1 },
  { levels: 5, total: 62, lastLevel: 32, price: 432.6 }
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

// 🔍 знайти першого з вільним місцем
function getNextParent(platform) {
  return slots.find(s =>
    s.platform === platform &&
    (!s.left || !s.right) &&
    !s.closed
  ) || null;
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

// 💰 закриття площадки + реінвест
function checkClose(slot) {
  const config = LEVELS[slot.platform];
  if (!config) return;

  const total = countChildren(slot.id);

  if (total >= config.total - 1 && !slot.closed) {
    slot.closed = true;

    const reward = config.lastLevel * config.price;

    console.log("🎉 CLOSED:", slot.userId, "| platform", slot.platform);
    console.log("💰 EARNED:", reward, "TON");

    slot.earnings += reward;

    // 🔁 реінвест в ту ж площадку
    const reinvestSlot = createSlot(slot.userId, slot.platform);
    placeSlot(reinvestSlot);
  }
}

// ➕ вставка в дерево
function placeSlot(slot) {
  const parent = getNextParent(slot.platform);

  if (!parent) {
    slots.push(slot);
    console.log("👑 FIRST SLOT:", slot.userId);
    return;
  }

  console.log("💸 Payment →", parent.userId, "| platform", slot.platform);

  if (!parent.left) {
    parent.left = slot.id;
  } else {
    parent.right = slot.id;
  }

  slot.parentId = parent.id;
  slots.push(slot);

  // перевірка вверх
  let current = parent;

  while (current) {
    checkClose(current);

    if (!current.parentId) break;
    current = slots.find(s => s.id === current.parentId);
  }
}

// 🚀 РЕЄСТРАЦІЯ
app.post('/register', (req, res) => {
  try {
    const userId = req.body?.userId;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    const slot1 = createSlot(userId + "_1", 0);
    const slot2 = createSlot(userId + "_2", 0);
    const slot3 = createSlot(userId + "_3", 0);

    placeSlot(slot1);
    placeSlot(slot2);
    placeSlot(slot3);

    res.json({
      message: "User entered with 3 slots (1.5 TON)",
      slots: [slot1, slot2, slot3]
    });

  } catch (error) {
    console.log("REGISTER ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 📊 всі слоти
app.get('/slots', (req, res) => {
  res.json(slots);
});

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});