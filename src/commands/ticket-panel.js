const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket-panel")
        .setDescription("Send the AI Support ticket panel")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle("🎫 Support Center")
            .setDescription(
                "Need help? Open a support ticket below.\n\n" +
                "Choose the priority that best matches your issue.\n" +
                "Please select the correct priority so our Support Team can respond appropriately."
            )
            .addFields(
                {
                    name: "🟢 Low Priority",
                    value: "General questions, feedback, or non-urgent requests.",
                    inline: true
                },
                {
                    name: "🔵 Normal Priority",
                    value: "Regular support issues that need assistance.",
                    inline: true
                },
                {
                    name: "🟠 High Priority",
                    value: "Important issues that should be handled sooner.",
                    inline: true
                },
                {
                    name: "🔴 Urgent Priority",
                    value: "Critical issues requiring immediate attention.",
                    inline: true
                }
            )
            .setFooter({
                text: "Resolve • AI Support"
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("ticket_priority_low")
                .setLabel("Low")
                .setEmoji("🟢")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId("ticket_priority_normal")
                .setLabel("Normal")
                .setEmoji("🔵")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("ticket_priority_high")
                .setLabel("High")
                .setEmoji("🟠")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("ticket_priority_urgent")
                .setLabel("Urgent")
                .setEmoji("🔴")
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.channel.send({
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({
            content: "✅ Support ticket panel posted.",
            ephemeral: true
        });
    }
};