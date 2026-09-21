const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pay")
        .setDescription("Send coins to another player.")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("The player you want to pay.")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("How many coins do you want to send?")
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const senderId = interaction.user.id;
        const receiver = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        if (receiver.bot) {
            return interaction.reply({
                content: "❌ You can't pay a bot.",
                ephemeral: true
            });
        }

        if (receiver.id === senderId) {
            return interaction.reply({
                content: "❌ You can't pay yourself.",
                ephemeral: true
            });
        }

        let sender = db.prepare(`
            SELECT coins
            FROM user_rewards
            WHERE guild_id = ? AND user_id = ?
        `).get(guildId, senderId);

        if (!sender) {
            db.prepare(`
                INSERT INTO user_rewards
                (guild_id, user_id, coins, last_daily)
                VALUES (?, ?, 0, 0)
            `).run(guildId, senderId);

            sender = { coins: 0 };
        }

        if (sender.coins < amount) {
            return interaction.reply({
                content:
                    `❌ You don't have enough coins!\n\n` +
                    `💰 Your balance: **${sender.coins.toLocaleString()}**\n` +
                    `💸 Amount: **${amount.toLocaleString()}**`,
                ephemeral: true
            });
        }

        const receiverExists = db.prepare(`
            SELECT coins
            FROM user_rewards
            WHERE guild_id = ? AND user_id = ?
        `).get(guildId, receiver.id);

        if (!receiverExists) {
            db.prepare(`
                INSERT INTO user_rewards
                (guild_id, user_id, coins, last_daily)
                VALUES (?, ?, 0, 0)
            `).run(guildId, receiver.id);
        }

        const transfer = db.transaction(() => {
            db.prepare(`
                UPDATE user_rewards
                SET coins = coins - ?
                WHERE guild_id = ? AND user_id = ?
            `).run(amount, guildId, senderId);

            db.prepare(`
                UPDATE user_rewards
                SET coins = coins + ?
                WHERE guild_id = ? AND user_id = ?
            `).run(amount, guildId, receiver.id);
        });

        transfer();

        const newBalance = sender.coins - amount;

        const embed = new EmbedBuilder()
            .setColor(0x22c55e)
            .setTitle("💸 Payment Sent")
            .setDescription(
                `You sent **${amount.toLocaleString()} coins** to ${receiver}!\n\n` +
                `💰 Your new balance: **${newBalance.toLocaleString()} coins**`
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