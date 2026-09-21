const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("Check your GameLog coin balance."),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        let user = db.prepare(`
            SELECT coins
            FROM user_rewards
            WHERE guild_id = ? AND user_id = ?
        `).get(guildId, userId);

        if (!user) {
            db.prepare(`
                INSERT INTO user_rewards
                (guild_id, user_id, coins, last_daily)
                VALUES (?, ?, 0, 0)
            `).run(guildId, userId);

            user = {
                coins: 0
            };
        }

        const embed = new EmbedBuilder()
            .setColor(0x7c3aed)
            .setTitle("💰 Your Balance")
            .setDescription(
                `${interaction.user}, you currently have:\n\n` +
                `🪙 **${user.coins.toLocaleString()} coins**`
            )
            .setThumbnail(
                interaction.user.displayAvatarURL({
                    size: 256
                })
            )
            .setFooter({
                text: "GameLog Economy"
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};