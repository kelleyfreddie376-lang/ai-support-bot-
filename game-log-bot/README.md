<div align="center">

# 🎮 GAMELOG

### ╔══════════════════════════════════╗

### ║        **ＭＡＤＥ ＢＹ ＦＲＥＤＤＩＥ**        ║

### ╚══════════════════════════════════╝

**Games • Logging • Statistics • Server Tools**

[![Discord.js](https://img.shields.io/badge/Discord.js-5865F2?style=for-the-badge\&logo=discord\&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge\&logo=node.js\&logoColor=white)](#)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge\&logo=sqlite\&logoColor=white)](#)

</div>

---

## 🎮 What is GameLog?

**GameLog** is a Discord bot built to bring fun games, detailed server logging, statistics, and useful server tools together in one bot.

The project is designed to be easy to expand with new games and features.

---

## ✨ Features

### 🎲 Games

* 🪙 Coin Flip
* 🎲 Dice
* ✊ Rock Paper Scissors
* 🧠 Trivia
* 🎰 Slots
* 🃏 Blackjack
* 🔢 Number Guessing
* 🏆 Leaderboards

### 📋 Logging

* 👋 Member joins
* 🚪 Member leaves
* 📝 Message edits
* 🗑️ Message deletions
* 🔨 Bans
* 👢 Kicks
* ⏰ Timeouts
* 🎭 Role changes
* 📁 Channel changes
* 🎮 Game activity
* ⚠️ Bot errors

### 🔄 Live Status

GameLog automatically changes its Discord status every **10 seconds**.

Example:

```text
🎮 Playing /games
👀 Watching 5 servers
🎲 Playing Games
📋 Watching server events
```

---

## 🛠️ Built With

| Technology        | Purpose               |
| ----------------- | --------------------- |
| 🟢 Node.js        | Bot runtime           |
| 💬 Discord.js     | Discord API           |
| 💾 SQLite         | Database              |
| 📦 Better-SQLite3 | Database management   |
| 🔐 dotenv         | Environment variables |
| 🔄 Nodemon        | Development           |

---

## 📁 Project Structure

```text
game-log-bot/
│
├── 📁 src/
│   ├── 📁 commands/
│   │   └── 📁 games/
│   │
│   ├── 📁 events/
│   │
│   ├── 📁 services/
│   │
│   ├── 📁 database/
│   │   └── database.js
│   │
│   └── index.js
│
├── 📁 database/
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure `.env`

```env
DISCORD_TOKEN=YOUR_BOT_TOKEN
CLIENT_ID=YOUR_APPLICATION_ID
GUILD_ID=YOUR_TEST_SERVER_ID
```

### 3. Start the bot

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

---

## 🔐 Security

Never share your Discord bot token.

The `.env` file is excluded from Git using `.gitignore`.

---

<div align="center">

### ═══════════════════════════════════════

## 💜 ＭＡＤＥ ＢＹ ＦＲＥＤＤＩＥ

**Built with Node.js • Made for Discord**

### ═══════════════════════════════════════

**© 2026 Freddie**
