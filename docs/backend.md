# 🧠 Backend Logic — Triangle TON

## 🔺 Основа

Система працює через чергу (FIFO)

Кожен новий triangle:
→ додається в кінець

---

## 📊 Структура

Triangle:
- id
- owner_id
- parent_id
- left_child
- right_child
- level
- reinvest_count

---

## 🔁 Додавання в систему

function addTriangle(triangle):

    parent = getNextFreeParent()

    if parent.left is empty:
        parent.left = triangle
    else:
        parent.right = triangle
        moveQueue()

    triangle.parent = parent

---

## 🔍 Пошук місця

function getNextFreeParent():

    беремо першого в черзі

    якщо у нього < 2 дітей:
        повертаємо його

    інакше:
        рухаємо чергу вперед

---

## 🔄 Перелив

Якщо у користувача вже 2 людини:

→ нові йдуть нижче

---

## 🔁 Реінвест

function reinvest(triangle):

    новий = clone(triangle)

    додаємо в кінець черги

---

## 🔼 Upgrade

Після закриття рівня:

→ triangle переходить на наступний level

---

## 🧠 Висновок

- структура будується автоматично
- люди не обирають позицію
- система сама розставляє