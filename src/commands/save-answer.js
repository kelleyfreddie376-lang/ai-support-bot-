const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require("discord.js");

const db = require("../database/db");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("save-answer")
        .setDescription("Save a staff answer to Resolve's approved AI knowledge.")
        .addStringOption(option =>
            option
                .setName("question")
                .setDescription("The question this answer solves.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("answer")
                .setDescription("The correct answer Resolve should remember.")
                .setRequired(true)
        ),

    async execute(interaction) {
        try {
            if (!interaction.guild) {
                return interaction.reply({
                    content: "❌ This command can only be used inside a server.",
                    ephemeral: true
                });
            }

            const question =
                interaction.options.getString("question");

            const answer =
                interaction.options.getString("answer");

            // Get the configured Support Team role
            const settingsResult = await db.query(
                `
                SELECT support_role_id
                FROM guild_settings
                WHERE guild_id = $1
                `,
                [interaction.guild.id]
            );

            const supportRoleId =
                settingsResult.rows[0]?.support_role_id;

            const isServerManager =
                interaction.member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                );

            const isSupportTeam =
                supportRoleId &&
                interaction.member.roles.cache.has(
                    supportRoleId
                );

            if (!isServerManager && !isSupportTeam) {
                return interaction.reply({
                    content:
                        "❌ You need to be a **Support Team member** or have **Manage Server** permission to save AI knowledge.",
                    ephemeral: true
                });
            }

            // Save to the main knowledge table
            await db.query(
                `
                INSERT INTO knowledge (
                    guild_id,
                    title,
                    content,
                    created_by,
                    approved
                )
                VALUES ($1, $2, $3, $4, TRUE)
                `,
                [
                    interaction.guild.id,
                    question,
                    answer,
                    interaction.user.id
                ]
            );

            // Also save it as an approved answer
            await db.query(
                `
                INSERT INTO approved_answers (
                    guild_id,
                    question,
                    answer,
                    approved_by
                )
                VALUES ($1, $2, $3, $4)
                `,
                [
                    interaction.guild.id,
                    question,
                    answer,
                    interaction.user.id
                ]
            );

            return interaction.reply({
                content:
                    `🧠 **Knowledge Saved!**\n\n` +
                    `**Question:**\n${question}\n\n` +
                    `**Answer:**\n${answer}\n\n` +
                    `✅ Resolve can now use this approved information when helping users.`,
                ephemeral: true
            });

        } catch (error) {
            console.error(
                "❌ Save-answer command error:",
                error
            );

            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({
                    content:
                        "❌ Something went wrong while saving this knowledge.",
                    ephemeral: true
                });
            }

            return interaction.reply({
                content:
                    "❌ Something went wrong while saving this knowledge.",
                ephemeral: true
            });
        }
    }
};