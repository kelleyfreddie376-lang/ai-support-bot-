const db = require("./db");

async function initDatabase() {
    console.log("🗄️ Initializing database...");

    await db.query(`
        CREATE TABLE IF NOT EXISTS guilds (
            id BIGSERIAL PRIMARY KEY,
            guild_id TEXT NOT NULL UNIQUE,
            guild_name TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS guild_settings (
            id BIGSERIAL PRIMARY KEY,
            guild_id TEXT NOT NULL UNIQUE REFERENCES guilds(guild_id) ON DELETE CASCADE,
            support_role_id TEXT,
            ticket_category_id TEXT,
            ai_enabled BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS knowledge (
            id BIGSERIAL PRIMARY KEY,
            guild_id TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_by TEXT,
            approved BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS knowledge_channels (
            id BIGSERIAL PRIMARY KEY,
            guild_id TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
            channel_id TEXT NOT NULL,
            channel_name TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            UNIQUE (
                guild_id,
                channel_id
            )
        );

        CREATE TABLE IF NOT EXISTS tickets (
            id BIGSERIAL PRIMARY KEY,
            guild_id TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
            channel_id TEXT NOT NULL UNIQUE,
            user_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open',
            priority TEXT NOT NULL DEFAULT 'normal',
            claimed_by TEXT,
            welcome_message_id TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            closed_at TIMESTAMPTZ
        );

        CREATE TABLE IF NOT EXISTS ticket_messages (
            id BIGSERIAL PRIMARY KEY,
            ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL,
            is_staff BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS approved_answers (
            id BIGSERIAL PRIMARY KEY,
            guild_id TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            approved_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS achievements (
            id BIGSERIAL PRIMARY KEY,
            guild_id TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
            user_id TEXT NOT NULL,
            achievement_key TEXT NOT NULL,
            achievement_name TEXT NOT NULL,
            description TEXT,
            emoji TEXT,
            earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            UNIQUE (
                guild_id,
                user_id,
                achievement_key
            )
        );

        ALTER TABLE tickets
        ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal';

        ALTER TABLE tickets
        ADD COLUMN IF NOT EXISTS welcome_message_id TEXT;

        ALTER TABLE knowledge
        ADD COLUMN IF NOT EXISTS source_channel_id TEXT;

        ALTER TABLE achievements
        ADD COLUMN IF NOT EXISTS emoji TEXT;

        CREATE INDEX IF NOT EXISTS idx_knowledge_guild
            ON knowledge(guild_id);

        CREATE INDEX IF NOT EXISTS idx_knowledge_channels_guild
            ON knowledge_channels(guild_id);

        CREATE INDEX IF NOT EXISTS idx_tickets_guild
            ON tickets(guild_id);

        CREATE INDEX IF NOT EXISTS idx_tickets_priority
            ON tickets(priority);

        CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket
            ON ticket_messages(ticket_id);

        CREATE INDEX IF NOT EXISTS idx_approved_answers_guild
            ON approved_answers(guild_id);

        CREATE INDEX IF NOT EXISTS idx_achievements_user
            ON achievements(guild_id, user_id);

        CREATE INDEX IF NOT EXISTS idx_achievements_guild
            ON achievements(guild_id);

        CREATE INDEX IF NOT EXISTS idx_knowledge_source_channel
            ON knowledge(guild_id, source_channel_id);
    `);

    console.log("✅ Database initialized successfully.");
}

module.exports = {
    initDatabase
};