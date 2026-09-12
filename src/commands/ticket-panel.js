const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const PANEL_TITLE = "🎫 Resolve Support Center";
const PANEL_FOOTER = "Resolve • AI Support";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket-panel")
        .setDescription("Send or update the AI Support ticket panel")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const channel = interaction.channel;

        try {
            // ==========================================
            // SUPPORT EMBED
            // ==========================================

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(PANEL_TITLE)
                .setDescription(
                    "**Need help? We're here for you.**\n\n" +
                    "Open a support ticket by choosing the priority that best matches your issue.\n\n" +
                    "🤖 **Resolve AI** will try to help using verified server knowledge.\n" +
                    "👤 **Support Team** members can step in whenever human assistance is needed."
                )
                .addFields(
                    {
                        name: "🟢 Low",
                        value:
                            "General questions, feedback, or non-urgent requests.",
                        inline: true
                    },
                    {
                        name: "🔵 Normal",
                        value:
                            "Regular support issues that need assistance.",
                        inline: true
                    },
                    {
                        name: "🟠 High",
                        value:
                            "Important issues that should be handled sooner.",
                        inline: true
                    },
                    {
                        name: "🔴 Urgent",
                        value:
                            "Critical issues that genuinely require immediate attention.",
                        inline: true
                    },
                    {
                        name: "📌 Before Opening",
                        value:
                            "Please choose the correct priority and explain your issue clearly once your ticket opens.",
                        inline: false
                    }
                )
                .setFooter({
                    text: PANEL_FOOTER
                })
                .setTimestamp();

            // ==========================================
            // PRIORITY BUTTONS
            // ==========================================

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

            // ==========================================
            // FIND EXISTING RESOLVE PANEL
            // ==========================================

            const messages = await channel.messages.fetch({
                limit: 100
            });

            const existingPanel = messages.find(message =>
                message.author.id === interaction.client.user.id &&
                message.embeds.some(existingEmbed =>
                    existingEmbed.title === PANEL_TITLE &&
                    existingEmbed.footer?.text === PANEL_FOOTER
                )
            );

            // ==========================================
            // UPDATE EXISTING PANEL
            // ==========================================

            if (existingPanel) {
                await existingPanel.edit({
                    embeds: [embed],
                    components: [row]
                });

                return interaction.reply({
                    content: "✅ The existing support panel has been updated.",
                    ephemeral: true
                });
            }

            // ==========================================
            // CREATE PANEL IF NONE EXISTS
            // ==========================================

            await channel.send({
                embeds: [embed],
                components: [row]
            });

            await interaction.reply({
                content: "✅ Support ticket panel created.",
                ephemeral: true
            });

        } catch (error) {
            console.error("❌ Ticket panel error:", error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: "❌ I couldn't create or update the ticket panel.",
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: "❌ I couldn't create or update the ticket panel.",
                    ephemeral: true
                });
            }
        }
    }
};