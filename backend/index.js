const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

let triangles = [];

// 🔺 створення трикутника
function createTriangle(userId) {
    return {
        id: uuidv4(),
        userId,
        parentId: null,
        left: null,
        right: null
    };
}

// 🔍 знайти першого з вільними місцями
function getNextParent() {
    for (let i = 0; i < triangles.length; i++) {
        let t = triangles[i];

        if (!t.left || !t.right) {
            return t;
        }
    }
    return null;
}

// ➕ додати один елемент в дерево
function placeTriangle(triangle) {
    if (triangles.length === 0) {
        triangles.push(triangle);
        console.log("👑 First user in system");
        return triangle;
    }

    let parent = getNextParent();

    if (!parent) {
        console.log("❌ No available parent");
        return null;
    }

    console.log("💰 Payment goes to:", parent.userId);

    if (!parent.left) {
        parent.left = triangle.id;
    } else {
        parent.right = triangle.id;
    }

    triangle.parentId = parent.id;

    triangles.push(triangle);

    return triangle;
}

// 🚀 API: реєстрація (ТРИКУТНИК)
app.post('/register', (req, res) => {
    const userId = req.body?.userId;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    // створюємо 3 позиції
    const master = createTriangle(userId);
    const left = createTriangle(userId + "_L");
    const right = createTriangle(userId + "_R");

    // 1️⃣ ставимо master в дерево
    placeTriangle(master);

    // 2️⃣ ставимо дітей ПІД master (не через загальну чергу!)
    left.parentId = master.id;
    right.parentId = master.id;

    master.left = left.id;
    master.right = right.id;

    triangles.push(left);
    triangles.push(right);

    res.json({
        message: "Triangle created",
        master
    });
});

// 📊 отримати всі трикутники
app.get('/triangles', (req, res) => {
    res.json(triangles);
});

// ▶️ запуск
app.listen(3000, () => {
    console.log("Server running on port 3000");
});