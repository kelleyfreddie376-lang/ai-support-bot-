const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("daily")
        .setDescription("Claim your daily GameLog reward."),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000;

        const user = db.prepare(`
            SELECT *
            FROM user_rewards
            WHERE guild_id = ? AND user_id = ?
        `).get(guildId, userId);

        if (!user) {
            db.prepare(`
                INSERT INTO user_rewards
                (guild_id, user_id, coins, last_daily)
                VALUES (?, ?, 0, 0)
            `).run(guildId, userId);
        }

        const currentUser = user || {
            coins: 0,
            last_daily: 0
        };

        const timeSinceDaily = now - currentUser.last_daily;

        if (timeSinceDaily < cooldown) {
            const remaining = cooldown - timeSinceDaily;

            const hours = Math.floor(
                remaining / (60 * 60 * 1000)
            );

            const minutes = Math.floor(
                (remaining % (60 * 60 * 1000)) / (60 * 1000)
            );

            const embed = new EmbedBuilder()
                .setColor(0xef4444)
                .setTitle("⏰ Daily Already Claimed")
                .setDescription(
                    `You've already claimed your daily reward!\n\n` +
                    `Come back in **${hours}h ${minutes}m**.`
                )
                .setFooter({
                    text: "GameLog • Daily Rewards"
                });

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        const reward = Math.floor(Math.random() * 501) + 500;
        const newBalance = currentUser.coins + reward;

        db.prepare(`
            UPDATE user_rewards
            SET coins = ?, last_daily = ?
            WHERE guild_id = ? AND user_id = ?
        `).run(
            newBalance,
            now,
            guildId,
            userId
        );

        const embed = new EmbedBuilder()
            .setColor(0x22c55e)
            .setTitle("🎁 Daily Reward")
            .setDescription(
                `You claimed your daily reward!\n\n` +
                `🪙 **+${reward} coins**\n` +
                `💰 Balance: **${newBalance} coins**`
            )
            .setFooter({
                text: "Come back tomorrow for another reward!"
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};