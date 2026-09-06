const { EmbedBuilder } = require("discord.js");
const { askGemini } = require("../services/gemini");
const db = require("../database/db");

const {
    checkMessageAchievements,
    awardAchievement
} = require("../services/achievements");

const SUPPORT_SERVER_ID = "1545866787059671100";

/*
 * These are the official Resolve Support Server channels
 * that Resolve is allowed to learn from automatically.
 */
const AUTO_KNOWLEDGE_CHANNELS = [
    "📜・rules",
    "🤖・about-resolve",
    "📢・announcements",
    "🚀・updates",
    "📝・changelog",
    "🎫・support",
    "❓・faq",
    "🏆・achievements",
    "🎉・events",
    "💡・suggestions",
    "🐛・bug-reports"
];

/*
 * Get all useful text from a Discord message.
 */
function getMessageKnowledge(message) {
    const parts = [];

    if (message.content?.trim()) {
        parts.push(message.content.trim());
    }

    for (const embed of message.embeds) {
        if (embed.title) {
            parts.push(`Title: ${embed.title}`);
        }

        if (embed.description) {
            parts.push(embed.description);
        }

        if (embed.fields?.length) {
            for (const field of embed.fields) {
                parts.push(`${field.name}: ${field.value}`);
            }
        }

        if (embed.footer?.text) {
            parts.push(`Footer: ${embed.footer.text}`);
        }
    }

    return parts.join("\n");
}

/*
 * Check whether this is one of the official knowledge channels.
 */
function isAutomaticKnowledgeChannel(message) {
    if (!message.guild) return false;

    if (message.guild.id !== SUPPORT_SERVER_ID) {
        return false;
    }

    return AUTO_KNOWLEDGE_CHANNELS.includes(
        message.channel.name
    );
}

/*
 * Save a new message into the knowledge database.
 */
async function saveAutomaticKnowledge(message) {
    try {
        if (!isAutomaticKnowledgeChannel(message)) {
            return false;
        }

        if (message.author.bot) {
            return false;
        }

        const content = getMessageKnowledge(message);

        if (!content) {
            return false;
        }

        /*
         * Make sure the source_channel_id column exists.
         */
        await db.query(`
            ALTER TABLE knowledge
            ADD COLUMN IF NOT EXISTS source_channel_id TEXT
        `);

        /*
         * Store each important message separately.
         *
         * This makes updates easier to manage than replacing
         * the entire channel's knowledge every time.
         */
        await db.query(
            `
            INSERT INTO knowledge (
                guild_id,
                title,
                content,
                created_by,
                approved,
                source_channel_id
            )
            VALUES ($1, $2, $3, $4, TRUE, $5)
            `,
            [
                message.guild.id,
                `Automatic Knowledge • ${message.channel.name}`,
                content,
                message.author.id,
                message.channel.id
            ]
        );

        console.log(
            `🧠 Knowledge learned from #${message.channel.name}: ${message.id}`
        );

        /*
         * Tell staff that Resolve successfully learned it.
         */
        try {
            const confirmationEmbed = new EmbedBuilder()
                .setTitle("🧠 Knowledge Updated")
                .setDescription(
                    "Resolve automatically added this information to its support knowledge."
                )
                .addFields({
                    name: "📚 Source",
                    value: `<#${message.channel.id}>`,
                    inline: true
                })
                .setFooter({
                    text: "Resolve • Automatic Knowledge"
                })
                .setTimestamp();

            await message.channel.send({
                embeds: [confirmationEmbed]
            });
        } catch (error) {
            console.error(
                "⚠️ Could not send knowledge confirmation:",
                error
            );
        }

        return true;

    } catch (error) {
        console.error(
            "❌ Automatic knowledge error:",
            error
        );

        return false;
    }
}

/*
 * Retrieve approved knowledge for the current server.
 */
async function getServerKnowledge(guildId) {
    try {
        const result = await db.query(
            `
            SELECT
                title,
                content,
                source_channel_id
            FROM knowledge
            WHERE guild_id = $1
            AND approved = TRUE
            ORDER BY updated_at DESC, created_at DESC
            LIMIT 100
            `,
            [guildId]
        );

        return result.rows;

    } catch (error) {
        /*
         * Some older databases may not have updated_at.
         * Fall back to created_at.
         */
        try {
            const result = await db.query(
                `
                SELECT
                    title,
                    content,
                    source_channel_id
                FROM knowledge
                WHERE guild_id = $1
                AND approved = TRUE
                ORDER BY created_at DESC
                LIMIT 100
                `,
                [guildId]
            );

            return result.rows;

        } catch (fallbackError) {
            console.error(
                "❌ Failed to retrieve server knowledge:",
                fallbackError
            );

            return [];
        }
    }
}

/*
 * Build the knowledge section for Gemini.
 */
function buildKnowledgeContext(knowledge) {
    if (!knowledge.length) {
        return `
No approved server knowledge is currently available.

Do not invent server-specific information.
`;
    }

    /*
     * Prevent an extremely large database from creating
     * an unnecessarily huge AI prompt.
     */
    const MAX_KNOWLEDGE_LENGTH = 30000;

    let context = "";
    
    for (const item of knowledge) {
        const section =
            `\n--- ${item.title} ---\n` +
            `${item.content}\n`;

        if (
            context.length + section.length >
            MAX_KNOWLEDGE_LENGTH
        ) {
            break;
        }

        context += section;
    }

    return `
APPROVED SERVER KNOWLEDGE:

${context}

END APPROVED SERVER KNOWLEDGE.
`;
}

module.exports = {
    name: "messageCreate",

    async execute(message) {
        try {
            if (message.author.bot) return;

            /*
             * ==========================================
             * AUTOMATIC KNOWLEDGE WATCHER
             * ==========================================
             */

            if (isAutomaticKnowledgeChannel(message)) {
                await saveAutomaticKnowledge(message);
            }

            /*
             * ==========================================
             * ACHIEVEMENTS
             * ==========================================
             */

            if (
                message.guild &&
                message.guild.id === SUPPORT_SERVER_ID &&
                !message.channel.name?.startsWith("ticket-")
            ) {
                await checkMessageAchievements(
                    message.guild,
                    message.author.id
                );
            }

            /*
             * ==========================================
             * TICKET SYSTEM
             * ==========================================
             */

            if (!message.channel.name?.startsWith("ticket-")) {
                return;
            }

            const ticketResult = await db.query(
                `
                SELECT *
                FROM tickets
                WHERE channel_id = $1
                LIMIT 1
                `,
                [message.channel.id]
            );

            if (ticketResult.rows.length === 0) {
                return;
            }

            const ticket = ticketResult.rows[0];

            if (ticket.status === "closed") {
                return;
            }

            /*
             * Once a human takes over, AI stops responding.
             */
            if (ticket.status === "human") {
                return;
            }

            const settingsResult = await db.query(
                `
                SELECT
                    support_role_id,
                    ai_enabled
                FROM guild_settings
                WHERE guild_id = $1
                LIMIT 1
                `,
                [message.guild.id]
            );

            if (settingsResult.rows.length === 0) {
                return;
            }

            const settings = settingsResult.rows[0];

            if (!settings.ai_enabled) {
                return;
            }

            /*
             * ==========================================
             * TICKET ACHIEVEMENTS
             * ==========================================
             */

            await awardAchievement({
                guild: message.guild,
                userId: message.author.id,
                key: "resolve_explorer",
                name: "Resolve Explorer",
                description:
                    "You used Resolve for the first time.",
                emoji: "🤖"
            });

            await awardAchievement({
                guild: message.guild,
                userId: message.author.id,
                key: "knowledge_seeker",
                name: "Knowledge Seeker",
                description:
                    "You asked Resolve for help.",
                emoji: "🧠"
            });

            /*
             * ==========================================
             * LOAD SERVER KNOWLEDGE
             * ==========================================
             */

            const knowledge =
                await getServerKnowledge(
                    message.guild.id
                );

            const knowledgeContext =
                buildKnowledgeContext(
                    knowledge
                );

            await message.channel.sendTyping();

            /*
             * ==========================================
             * GEMINI PROMPT
             * ==========================================
             */

            const prompt = `
You are Resolve, an AI-powered support assistant for a Discord server.

You are currently helping a user inside a support ticket.

User: ${message.author.username}

User message:
${message.content}

${knowledgeContext}

IMPORTANT RULES:

- Be helpful, clear, friendly, and professional.
- Keep responses reasonably short.
- Use the APPROVED SERVER KNOWLEDGE whenever it contains information relevant to the user's question.
- Treat the approved server knowledge as the authoritative source for server-specific information.
- Never invent server rules, policies, commands, prices, procedures, events, dates, features, or other information.
- Never guess.
- If the approved knowledge does not contain enough information to confidently answer the question, do NOT make up an answer.
- If you cannot confidently answer using the approved knowledge, request human support.
- General knowledge is okay when it does not conflict with server-specific information.
- If server-specific information is required and it is not present in the approved knowledge, request human support.

If human support is required, your response MUST begin with exactly:

HANDOFF_NEEDED

When requesting human support, briefly explain why you cannot confidently answer.
`;

            const answer = await askGemini(prompt);

            if (!answer) {
                return;
            }

            const trimmedAnswer =
                answer.trim();

            /*
             * ==========================================
             * HUMAN HANDOFF
             * ==========================================
             */

            if (
                trimmedAnswer.startsWith(
                    "HANDOFF_NEEDED"
                )
            ) {
                await db.query(
                    `
                    UPDATE tickets
                    SET status = 'human'
                    WHERE channel_id = $1
                    AND status = 'open'
                    `,
                    [message.channel.id]
                );

                const cleanAnswer =
                    trimmedAnswer
                        .replace(
                            /^HANDOFF_NEEDED\s*/i,
                            ""
                        )
                        .trim();

                const handoffEmbed =
                    new EmbedBuilder()
                        .setTitle(
                            "👤 Human Support Needed"
                        )
                        .setDescription(
                            cleanAnswer ||
                            "I don't have enough information to confidently answer this. A member of the Support Team will help you."
                        )
                        .setFooter({
                            text:
                                "Resolve • AI Support"
                        })
                        .setTimestamp();

                await message.reply({
                    embeds: [
                        handoffEmbed
                    ]
                });

                if (
                    settings.support_role_id
                ) {
                    await message.channel.send({
                        content:
                            `<@&${settings.support_role_id}> 🔔 **Human support is needed in this ticket.**`
                    });
                } else {
                    await message.channel.send({
                        content:
                            "🔔 **Human support is needed in this ticket.**"
                    });
                }

                console.log(
                    `👤 AI handed ticket ${message.channel.id} to human support.`
                );

                return;
            }

            /*
             * ==========================================
             * NORMAL AI RESPONSE
             * ==========================================
             */

            await message.reply({
                content:
                    `🤖 ${trimmedAnswer}`
            });

        } catch (error) {
            console.error(
                "❌ AI support error:",
                error
            );
        }
    }
};