const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("View all AI Support Bot commands"),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle("🤖 AI Support Bot")
            .setDescription(
                "AI-powered support for your Discord server.\n\n" +
                "Use the commands below to get started."
            )
            .addFields(
                {
                    name: "🎫 Support",
                    value:
                        "`/ticket` — Open a support ticket\n" +
                        "`/setup` — Configure the support system",
                    inline: false
                },
                {
                    name: "🧠 AI",
                    value:
                        "`/knowledge` — Manage your server's AI knowledge\n" +
                        "`/ai` — Configure AI settings",
                    inline: false
                },
                {
                    name: "⚙️ General",
                    value:
                        "`/help` — Show this help menu\n" +
                        "`/status` — View bot status",
                    inline: false
                }
            )
            .setFooter({
                text: "AI Support Bot • Built for Discord"
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};