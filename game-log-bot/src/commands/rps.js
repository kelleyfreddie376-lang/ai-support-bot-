const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rps")
        .setDescription("Bet coins against the bot in Rock Paper Scissors.")
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("How many coins do you want to bet?")
                .setRequired(true)
                .setMinValue(1)
        )
        .addStringOption(option =>
            option
                .setName("choice")
                .setDescription("Choose Rock, Paper, or Scissors.")
                .setRequired(true)
                .addChoices(
                    {
                        name: "🪨 Rock",
                        value: "rock"
                    },
                    {
                        name: "📄 Paper",
                        value: "paper"
                    },
                    {
                        name: "✂️ Scissors",
                        value: "scissors"
                    }
                )
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const amount = interaction.options.getInteger("amount");
        const choice = interaction.options.getString("choice");

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
                    `🪙 Bet: **${amount.toLocaleString()}**`,
                ephemeral: true
            });
        }

        const choices = [
            "rock",
            "paper",
            "scissors"
        ];

        const botChoice =
            choices[Math.floor(Math.random() * choices.length)];

        let result;

        if (choice === botChoice) {
            result = "tie";
        } else if (
            (choice === "rock" && botChoice === "scissors") ||
            (choice === "paper" && botChoice === "rock") ||
            (choice === "scissors" && botChoice === "paper")
        ) {
            result = "win";
        } else {
            result = "lose";
        }

        let newBalance = user.coins;

        if (result === "win") {
            newBalance += amount;
        } else if (result === "lose") {
            newBalance -= amount;
        }

        db.prepare(`
            UPDATE user_rewards
            SET coins = ?
            WHERE guild_id = ? AND user_id = ?
        `).run(
            newBalance,
            guildId,
            userId
        );

        const emojis = {
            rock: "🪨",
            paper: "📄",
            scissors: "✂️"
        };

        const resultText = {
            win: "🎉 **You won!**",
            lose: "💸 **You lost!**",
            tie: "🤝 **It's a tie!**"
        };

        const embed = new EmbedBuilder()
            .setColor(
                result === "win"
                    ? 0x22c55e
                    : result === "lose"
                        ? 0xef4444
                        : 0xf59e0b
            )
            .setTitle("✊ Rock Paper Scissors")
            .setDescription(
                `You chose ${emojis[choice]} **${choice}**\n` +
                `GameLog chose ${emojis[botChoice]} **${botChoice}**\n\n` +
                `${resultText[result]}\n` +
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