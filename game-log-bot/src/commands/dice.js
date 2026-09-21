const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dice")
        .setDescription("Bet coins and roll the dice.")
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
                    `🎲 Bet: **${amount.toLocaleString()}**`,
                ephemeral: true
            });
        }

        const roll = Math.floor(Math.random() * 6) + 1;

        const won = roll >= 4;

        const newBalance = won
            ? user.coins + amount
            : user.coins - amount;

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
            .setColor(won ? 0x22c55e : 0xef4444)
            .setTitle("🎲 Dice Roll")
            .setDescription(
                `You rolled a **${roll}**!\n\n` +
                `${won ? "🎉 **You won!**" : "💸 **You lost!**"}\n` +
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