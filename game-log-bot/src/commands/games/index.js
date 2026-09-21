const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("games")
        .setDescription("View all available games."),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x7c3aed)
            .setTitle("🎮 GameLog Games")
            .setDescription(
                "Welcome to **GameLog Games!**\n\n" +
                "Choose a game below using the commands listed."
            )
            .addFields(
                {
                    name: "🪙 Coin Flip",
                    value: "`/coinflip` — Flip a coin!",
                    inline: true
                },
                {
                    name: "🎲 Dice",
                    value: "`/dice` — Roll the dice!",
                    inline: true
                },
                {
                    name: "✊ Rock Paper Scissors",
                    value: "`/rps` — Challenge the bot!",
                    inline: true
                },
                {
                    name: "🧠 Trivia",
                    value: "`/trivia` — Test your knowledge!",
                    inline: true
                },
                {
                    name: "🎰 Slots",
                    value: "`/slots` — Try your luck!",
                    inline: true
                },
                {
                    name: "🏆 Leaderboard",
                    value: "`/leaderboard` — See the top players!",
                    inline: true
                }
            )
            .setFooter({
                text: "MADE BY FREDDIE • GameLog"
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};