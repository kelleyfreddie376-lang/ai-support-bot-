const { Pool } = require("pg");

require("dotenv").config();

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing from .env");
}

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

db.on("error", (error) => {
    console.error("❌ Unexpected database error:", error);
});

module.exports = db;