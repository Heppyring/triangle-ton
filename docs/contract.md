# 💣 Smart Contract Logic — Triangle TON

## 🔺 Основа

Контракт приймає тільки повну оплату трикутника:

Level 1: 1.5 TON  
Level 2: 12.3 TON  
Level 3: 61.5 TON  
Level 4: 150 TON  
Level 5: 450 TON  

---

## 🔐 Перевірка входу

function validate(amount):

    if amount != level_price × 3:
        reject transaction

---

## 🧠 Реєстрація

function register(user, referrer):

    create triangle

    place in structure

    distribute payments

---

## 💰 Розподіл коштів

function distribute(triangle):

    parent = getUpline(triangle)

    send(level_price → parent)

(повторюється для 3 позицій)

---

## 🔼 Пошук аплайна

function getUpline(triangle):

    повертає parent у структурі

---

## 🔁 Реінвест

function reinvest(triangle):

    утримати 1 позицію (price)

    створити новий triangle

    додати в кінець

---

## 🔄 Upgrade

function upgrade(triangle):

    якщо рівень закрито:

        перейти на наступний level

---

## 🔐 Безпека

- тільки контракт приймає кошти
- ручні перекази ігноруються
- всі виплати автоматичні

---

## ⚠️ Важливо

- 100% коштів у мережу
- контракт не зберігає баланс
- всі гроші одразу розподіляються

---

## 🚀 Висновок

Контракт:

- приймає TON
- перевіряє суму
- реєструє triangle
- розподіляє гроші
- запускає реінвест