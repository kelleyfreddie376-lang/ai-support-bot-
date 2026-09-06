const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const db = require("../database/db");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("knowledge")
        .setDescription("Manage Resolve's server knowledge")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Add information to Resolve's knowledge")
                .addStringOption(option =>
                    option
                        .setName("title")
                        .setDescription("A short title for this information")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("content")
                        .setDescription("The information Resolve should know")
                        .setRequired(true)
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("View this server's verified knowledge")
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Remove knowledge")
                .addIntegerOption(option =>
                    option
                        .setName("id")
                        .setDescription("The knowledge ID to remove")
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            await db.query(
                `
                INSERT INTO guilds (guild_id, guild_name)
                VALUES ($1, $2)
                ON CONFLICT (guild_id)
                DO UPDATE SET guild_name = EXCLUDED.guild_name
                `,
                [
                    interaction.guild.id,
                    interaction.guild.name
                ]
            );

            // ==============================
            // ADD KNOWLEDGE
            // ==============================

            if (subcommand === "add") {
                const title = interaction.options.getString("title");
                const content = interaction.options.getString("content");

                const result = await db.query(
                    `
                    INSERT INTO knowledge (
                        guild_id,
                        title,
                        content,
                        created_by,
                        approved
                    )
                    VALUES ($1, $2, $3, $4, FALSE)
                    RETURNING id
                    `,
                    [
                        interaction.guild.id,
                        title,
                        content,
                        interaction.user.id
                    ]
                );

                const knowledgeId = result.rows[0].id;

                const embed = new EmbedBuilder()
                    .setTitle("🧠 Knowledge Submitted")
                    .setDescription(
                        "This information has been submitted for verification.\n\n" +
                        "Resolve will **not use this information** until it has been approved."
                    )
                    .addFields(
                        {
                            name: "📌 Title",
                            value: title,
                            inline: false
                        },
                        {
                            name: "📖 Information",
                            value: content,
                            inline: false
                        },
                        {
                            name: "🆔 Knowledge ID",
                            value: String(knowledgeId),
                            inline: true
                        },
                        {
                            name: "🔐 Status",
                            value: "⏳ Pending Verification",
                            inline: true
                        }
                    )
                    .setFooter({
                        text: "Resolve • Knowledge Verification"
                    })
                    .setTimestamp();

                const buttons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`knowledge_approve_${knowledgeId}`)
                        .setLabel("Approve")
                        .setEmoji("✅")
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId(`knowledge_reject_${knowledgeId}`)
                        .setLabel("Reject")
                        .setEmoji("❌")
                        .setStyle(ButtonStyle.Danger)
                );

                await interaction.reply({
                    embeds: [embed],
                    components: [buttons]
                });

                return;
            }

            // ==============================
            // LIST KNOWLEDGE
            // ==============================

            if (subcommand === "list") {
                const result = await db.query(
                    `
                    SELECT id, title, content
                    FROM knowledge
                    WHERE guild_id = $1
                    AND approved = TRUE
                    ORDER BY id ASC
                    `,
                    [interaction.guild.id]
                );

                if (result.rows.length === 0) {
                    return interaction.reply({
                        content: "📚 This server doesn't have any verified knowledge yet."
                    });
                }

                const description = result.rows
                    .map(item =>
                        `**#${item.id} — ${item.title}**\n${item.content}`
                    )
                    .join("\n\n");

                const embed = new EmbedBuilder()
                    .setTitle("📚 Resolve Knowledge")
                    .setDescription(description.slice(0, 4000))
                    .setFooter({
                        text: `${result.rows.length} verified knowledge item(s)`
                    })
                    .setTimestamp();

                await interaction.reply({
                    embeds: [embed]
                });

                return;
            }

            // ==============================
            // REMOVE KNOWLEDGE
            // ==============================

            if (subcommand === "remove") {
                const id = interaction.options.getInteger("id");

                const result = await db.query(
                    `
                    DELETE FROM knowledge
                    WHERE id = $1
                    AND guild_id = $2
                    RETURNING title
                    `,
                    [
                        id,
                        interaction.guild.id
                    ]
                );

                if (result.rows.length === 0) {
                    return interaction.reply({
                        content: "❌ I couldn't find that knowledge item in this server.",
                        ephemeral: true
                    });
                }

                await interaction.reply({
                    content: `✅ Removed knowledge item **#${id} — ${result.rows[0].title}**.`
                });

                return;
            }

        } catch (error) {
            console.error("❌ Knowledge command error:", error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: "❌ Something went wrong while managing the knowledge system.",
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: "❌ Something went wrong while managing the knowledge system.",
                    ephemeral: true
                });
            }
        }
    }
};