const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("slots")
        .setDescription("Play the slot machine with your coins.")
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("How many coins do you want to bet?")
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const amount = interaction.options.getInteger("amount");

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

            user = { coins: 0 };
        }

        if (user.coins < amount) {
            return interaction.reply({
                content:
                    `❌ You don't have enough coins!\n` +
                    `💰 Balance: **${user.coins.toLocaleString()}**\n` +
                    `🎰 Bet: **${amount.toLocaleString()}**`,
                ephemeral: true
            });
        }

        const symbols = ["🍒", "🍋", "🍊", "🔔", "⭐", "💎"];

        const slot1 =
            symbols[Math.floor(Math.random() * symbols.length)];

        const slot2 =
            symbols[Math.floor(Math.random() * symbols.length)];

        const slot3 =
            symbols[Math.floor(Math.random() * symbols.length)];

        let winnings = 0;
        let resultText;

        if (slot1 === slot2 && slot2 === slot3) {
            winnings = amount * 5;
            resultText = `🎉 **JACKPOT! +${winnings.toLocaleString()} coins!**`;
        } else if (
            slot1 === slot2 ||
            slot2 === slot3 ||
            slot1 === slot3
        ) {
            winnings = amount * 2;
            resultText = `✨ **Two matching symbols! +${winnings.toLocaleString()} coins!**`;
        } else {
            resultText = `💸 **No match! You lost ${amount.toLocaleString()} coins.**`;
        }

        const newBalance =
            user.coins - amount + winnings;

        db.prepare(`
            UPDATE user_rewards
            SET coins = ?
            WHERE guild_id = ? AND user_id = ?
        `).run(
            newBalance,
            guildId,
            userId
        );

        const embed = new EmbedBuilder()
            .setColor(
                winnings > 0
                    ? 0x22c55e
                    : 0xef4444
            )
            .setTitle("🎰 GameLog Slots")
            .setDescription(
                `## ${slot1}・${slot2}・${slot3}\n\n` +
                `${resultText}\n\n` +
                `🪙 Bet: **${amount.toLocaleString()} coins**\n` +
                `💰 Balance: **${newBalance.toLocaleString()} coins**`
            )
            .setFooter({
                text: `GameLog Economy • ${interaction.user.username}`
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};