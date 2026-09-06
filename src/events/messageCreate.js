const { EmbedBuilder } = require("discord.js");
const { askGemini } = require("../services/gemini");
const db = require("../database/db");

module.exports = {
    name: "messageCreate",

    async execute(message) {
        if (message.author.bot) return;

        if (!message.channel.name.startsWith("ticket-")) return;

        try {
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

            // Stop AI if a human is handling the ticket
            if (ticket.status === "human") return;

            // Stop AI if ticket is closed
            if (ticket.status === "closed") return;

            // Get server settings
            const settingsResult = await db.query(
                `
                SELECT support_role_id, ai_enabled
                FROM guild_settings
                WHERE guild_id = $1
                LIMIT 1
                `,
                [message.guild.id]
            );

            if (settingsResult.rows.length === 0) return;

            const settings = settingsResult.rows[0];

            // AI disabled for this server
            if (!settings.ai_enabled) return;

            await message.channel.sendTyping();

            const prompt = `
You are Resolve, an AI-powered support assistant for a Discord server.

A user is asking for help inside a support ticket.

User: ${message.author.username}

Message:
${message.content}

Instructions:

- Be helpful, clear, and professional.
- Keep your response reasonably short.
- Only answer using information you are confident about.
- Never invent server rules, policies, commands, prices, procedures, or other facts.
- If you can confidently answer the question, answer it normally.
- If you cannot confidently answer the question, human support is required.
- When human support is required, begin your response with exactly:
HANDOFF_NEEDED
`;

            const answer = await askGemini(prompt);

            if (!answer) return;

            // ==============================
            // HUMAN HANDOFF
            // ==============================

            if (answer.startsWith("HANDOFF_NEEDED")) {

                await db.query(
                    `
                    UPDATE tickets
                    SET status = 'human'
                    WHERE channel_id = $1
                    `,
                    [message.channel.id]
                );

                const cleanAnswer = answer
                    .replace("HANDOFF_NEEDED", "")
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

                await message.reply({
                    embeds: [handoffEmbed]
                });

                if (settings.support_role_id) {
                    await message.channel.send({
                        content: `<@&${settings.support_role_id}> 🔔 **Human support is needed in this ticket.**`
                    });
                } else {
                    await message.channel.send({
                        content: "🔔 **Human support is needed in this ticket.**"
                    });
                }

                console.log(
                    `👤 AI handed ticket ${message.channel.id} to human support.`
                );

                return;
            }

            // ==============================
            // NORMAL AI RESPONSE
            // ==============================

            await message.reply({
                content: `🤖 ${answer}`
            });

        } catch (error) {
            console.error("❌ AI support error:", error);
        }
    }
};