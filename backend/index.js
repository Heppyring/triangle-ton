const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

let slots = [];
let users = {}; // 🔥 зберігаємо рефералів

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

// 🔍 BFS всередині структури реферала
function getNextParentInTree(referrerId, platform) {
  const queue = [];

  const rootSlots = slots.filter(s => s.userId.startsWith(referrerId));
  queue.push(...rootSlots);

  while (queue.length > 0) {
    const current = queue.shift();

    if (
      current.platform === platform &&
      (!current.left || !current.right) &&
      !current.closed
    ) {
      return current;
    }

    if (current.left) {
      const leftNode = slots.find(s => s.id === current.left);
      if (leftNode) queue.push(leftNode);
    }

    if (current.right) {
      const rightNode = slots.find(s => s.id === current.right);
      if (rightNode) queue.push(rightNode);
    }
  }

  return null;
}

// 🔍 fallback (як було)
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

    // 🔁 реінвест (з тим самим рефералом)
    const userBase = slot.userId.split("_")[0];
    const ref = users[userBase]?.referrerId || null;

    const reinvestSlot = createSlot(slot.userId, slot.platform);
    placeSlot(reinvestSlot, ref);
  }
}

// ➕ вставка в дерево
function placeSlot(slot, referrerId = null) {
  let parent = null;

  // 🔥 якщо є реферал → шукаємо в його структурі
  if (referrerId && users[referrerId]) {
    parent = getNextParentInTree(referrerId, slot.platform);
  }

  // fallback якщо нема
  if (!parent) {
    parent = getNextParent(slot.platform);
  }

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
    const referrerId = req.body?.referrerId || null;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    // 🔥 зберігаємо реферала
    users[userId] = {
      referrerId
    };

    const slot1 = createSlot(userId + "_1", 0);
    const slot2 = createSlot(userId + "_2", 0);
    const slot3 = createSlot(userId + "_3", 0);

    placeSlot(slot1, referrerId);
    placeSlot(slot2, referrerId);
    placeSlot(slot3, referrerId);

    res.json({
      message: "User entered with referral system",
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