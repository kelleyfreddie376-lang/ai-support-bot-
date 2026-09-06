const { EmbedBuilder } = require("discord.js");
const { askGemini } = require("../services/gemini");
const db = require("../database/db");

module.exports = {
    name: "messageCreate",

    async execute(message) {
        try {
            // Ignore bots
            if (message.author.bot) return;

            // Only work inside ticket channels
            if (!message.channel.name?.startsWith("ticket-")) return;

            // Find the ticket
            const ticketResult = await db.query(
                `
                SELECT *
                FROM tickets
                WHERE channel_id = $1
                LIMIT 1
                `,
                [message.channel.id]
            );

            if (ticketResult.rows.length === 0) return;

            const ticket = ticketResult.rows[0];

            // ==========================================
            // TICKET STATUS
            // ==========================================

            // Closed tickets receive no AI responses
            if (ticket.status === "closed") {
                return;
            }

            // Human support is handling the ticket.
            // IMPORTANT:
            // We DO NOT delete, close, hide, or modify
            // the Discord channel here.
            if (ticket.status === "human") {
                return;
            }

            // ==========================================
            // SERVER SETTINGS
            // ==========================================

            const settingsResult = await db.query(
                `
                SELECT support_role_id, ai_enabled
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

            // AI disabled
            if (!settings.ai_enabled) {
                return;
            }

            // ==========================================
            // AI THINKING
            // ==========================================

            await message.channel.sendTyping();

            const prompt = `
You are Resolve, an AI-powered support assistant for a Discord server.

You are currently helping a user inside a support ticket.

User: ${message.author.username}

User message:
${message.content}

IMPORTANT RULES:

- Be helpful, clear, friendly, and professional.
- Keep responses reasonably short.
- Only provide information you are confident is correct.
- Never invent server rules, policies, commands, prices, procedures, or other information.
- Do not guess.
- If you know the answer, answer the user normally.
- If you do not know the answer or need human assistance, request a human handoff.

If human support is required, your response MUST begin with exactly:

HANDOFF_NEEDED

When requesting human support, briefly explain why you cannot confidently answer.
`;

            const answer = await askGemini(prompt);

            if (!answer) {
                return;
            }

            const trimmedAnswer = answer.trim();

            // ==========================================
            // HUMAN HANDOFF
            // ==========================================

            if (trimmedAnswer.startsWith("HANDOFF_NEEDED")) {

                // Change ONLY the database status.
                // Do NOT close the Discord channel.
                await db.query(
                    `
                    UPDATE tickets
                    SET status = 'human'
                    WHERE channel_id = $1
                    AND status = 'open'
                    `,
                    [message.channel.id]
                );

                const cleanAnswer = trimmedAnswer
                    .replace(/^HANDOFF_NEEDED\s*/i, "")
                    .trim();

                const handoffEmbed = new EmbedBuilder()
                    .setTitle("👤 Human Support Needed")
                    .setDescription(
                        cleanAnswer ||
                        "I don't have enough information to confidently answer this. A member of the Support Team will help you."
                    )
                    .setFooter({
                        text: "Resolve • AI Support"
                    })
                    .setTimestamp();

                // Tell the user that human support is taking over
                await message.reply({
                    embeds: [handoffEmbed]
                });

                // Notify support
                if (settings.support_role_id) {
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

                // IMPORTANT:
                // Do not delete the channel.
                // Do not hide the channel.
                // Do not mark the ticket closed.
                return;
            }

            // ==========================================
            // NORMAL AI RESPONSE
            // ==========================================

            await message.reply({
                content: `🤖 ${trimmedAnswer}`
            });

        } catch (error) {
            console.error(
                "❌ AI support error:",
                error
            );
        }
    }
};