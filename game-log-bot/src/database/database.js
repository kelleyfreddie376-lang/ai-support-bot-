const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const databaseFolder = path.join(__dirname, "../../database");

if (!fs.existsSync(databaseFolder)) {
    fs.mkdirSync(databaseFolder, { recursive: true });
}

const db = new Database(
    path.join(databaseFolder, "bot.db")
);

db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        log_channel_id TEXT,
        games_enabled INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS game_stats (
        guild_id TEXT PRIMARY KEY,
        games_played INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        type TEXT NOT NULL,
        user_id TEXT,
        channel_id TEXT,
        details TEXT,
        created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_rewards (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        coins INTEGER DEFAULT 0,
        last_daily INTEGER DEFAULT 0,
        last_work INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, user_id)
    );
`);

// Add last_work to existing databases that were created before /work existed.
try {
    db.prepare(`
        ALTER TABLE user_rewards
        ADD COLUMN last_work INTEGER DEFAULT 0
    `).run();

    console.log("✅ Added last_work column to user_rewards.");
} catch (error) {
    if (!error.message.includes("duplicate column name")) {
        throw error;
    }
}

console.log("✅ Database initialized successfully.");

module.exports = db;