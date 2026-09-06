const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/db");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Configure AI Support Bot for this server")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addRoleOption(option =>
            option
                .setName("support-role")
                .setDescription("The role that handles support tickets")
                .setRequired(true)
        )
        .addChannelOption(option =>
            option
                .setName("ticket-category")
                .setDescription("The category where support tickets will be created")
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true)
        ),

    async execute(interaction) {
        const supportRole = interaction.options.getRole("support-role");
        const ticketCategory = interaction.options.getChannel("ticket-category");

        try {
            // Make sure the server exists
            await db.query(
                `
                INSERT INTO guilds (guild_id, guild_name)
                VALUES ($1, $2)
                ON CONFLICT (guild_id)
                DO UPDATE SET guild_name = EXCLUDED.guild_name
                `,
                [interaction.guild.id, interaction.guild.name]
            );

            // Save the server settings
            await db.query(
                `
                INSERT INTO guild_settings (
                    guild_id,
                    support_role_id,
                    ticket_category_id
                )
                VALUES ($1, $2, $3)
                ON CONFLICT (guild_id)
                DO UPDATE SET
                    support_role_id = EXCLUDED.support_role_id,
                    ticket_category_id = EXCLUDED.ticket_category_id,
                    updated_at = NOW()
                `,
                [
                    interaction.guild.id,
                    supportRole.id,
                    ticketCategory.id
                ]
            );

            const embed = new EmbedBuilder()
                .setTitle("⚙️ Setup Complete")
                .setDescription(
                    "AI Support Bot has been configured for this server."
                )
                .addFields(
                    {
                        name: "👮 Support Team",
                        value: `<@&${supportRole.id}>`,
                        inline: true
                    },
                    {
                        name: "🎫 Ticket Category",
                        value: `<#${ticketCategory.id}>`,
                        inline: true
                    },
                    {
                        name: "🧠 AI Support",
                        value: "Enabled",
                        inline: true
                    }
                )
                .setFooter({
                    text: "AI Support Bot • Configuration"
                })
                .setTimestamp();

            await interaction.reply({
                embeds: [embed]
            });

            console.log(
                `⚙️ Setup completed for ${interaction.guild.name} (${interaction.guild.id})`
            );
        } catch (error) {
            console.error("❌ Setup command error:", error);

            await interaction.reply({
                content: "❌ I couldn't save the server configuration. Please try again.",
                ephemeral: true
            });
        }
    }
};