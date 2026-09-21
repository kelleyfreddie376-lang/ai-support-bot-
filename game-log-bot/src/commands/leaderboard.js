const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("View the richest players in this server."),

    async execute(interaction) {
        const guildId = interaction.guild.id;

        const players = db.prepare(`
            SELECT user_id, coins
            FROM user_rewards
            WHERE guild_id = ?
            ORDER BY coins DESC
            LIMIT 10
        `).all(guildId);

        if (players.length === 0) {
            return interaction.reply({
                content: "🏆 There aren't any players on the leaderboard yet!",
                ephemeral: true
            });
        }

        const medals = ["🥇", "🥈", "🥉"];

        const leaderboard = players
            .map((player, index) => {
                const position = medals[index] || `**${index + 1}.**`;

                return `${position} <@${player.user_id}> — 🪙 **${player.coins.toLocaleString()}**`;
            })
            .join("\n");

        const embed = new EmbedBuilder()
            .setColor(0x7c3aed)
            .setTitle("🏆 GameLog Economy Leaderboard")
            .setDescription(leaderboard)
            .setFooter({
                text: `${interaction.guild.name} • Top 10`
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};