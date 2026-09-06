const {
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const commands = require("../commands");
const db = require("../database/db");

module.exports = {
    name: "interactionCreate",

    async execute(interaction) {

        // ==========================================
        // SLASH COMMANDS
        // ==========================================

        if (interaction.isChatInputCommand()) {
            const command = commands.find(
                cmd => cmd.data.name === interaction.commandName
            );

            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(
                    `❌ Error running /${interaction.commandName}:`,
                    error
                );

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content:
                            "❌ Something went wrong while running that command.",
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content:
                            "❌ Something went wrong while running that command.",
                        ephemeral: true
                    });
                }
            }

            return;
        }

        // ==========================================
        // BUTTONS
        // ==========================================

        if (!interaction.isButton()) return;

        const customId = interaction.customId;

        // ==========================================
        // KNOWLEDGE APPROVE
        // ==========================================

        if (customId.startsWith("knowledge_approve_")) {
            const knowledgeId = customId.replace(
                "knowledge_approve_",
                ""
            );

            try {
                if (
                    !interaction.member.permissions.has(
                        PermissionFlagsBits.ManageGuild
                    )
                ) {
                    return interaction.reply({
                        content:
                            "❌ Only server managers can verify knowledge.",
                        ephemeral: true
                    });
                }

                const result = await db.query(
                    `
                    UPDATE knowledge
                    SET approved = TRUE,
                        updated_at = NOW()
                    WHERE id = $1
                    AND guild_id = $2
                    AND approved = FALSE
                    RETURNING title, content
                    `,
                    [
                        knowledgeId,
                        interaction.guild.id
                    ]
                );

                if (result.rows.length === 0) {
                    return interaction.reply({
                        content:
                            "❌ This knowledge item is already verified or no longer exists.",
                        ephemeral: true
                    });
                }

                const knowledge = result.rows[0];

                const embed = new EmbedBuilder()
                    .setTitle("✅ Knowledge Verified")
                    .setDescription(
                        "This information has been approved and can now be used by Resolve."
                    )
                    .addFields(
                        {
                            name: "📌 Title",
                            value: knowledge.title,
                            inline: false
                        },
                        {
                            name: "📖 Information",
                            value: knowledge.content,
                            inline: false
                        },
                        {
                            name: "👤 Verified By",
                            value: `<@${interaction.user.id}>`,
                            inline: true
                        },
                        {
                            name: "🔐 Status",
                            value: "✅ Verified",
                            inline: true
                        }
                    )
                    .setFooter({
                        text: "Resolve • Knowledge Verification"
                    })
                    .setTimestamp();

                await interaction.update({
                    embeds: [embed],
                    components: []
                });

                console.log(
                    `✅ Knowledge #${knowledgeId} approved by ${interaction.user.tag}`
                );

                return;

            } catch (error) {
                console.error(
                    "❌ Knowledge approval error:",
                    error
                );

                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content:
                            "❌ I couldn't verify this knowledge item.",
                        ephemeral: true
                    });
                }

                return;
            }
        }

        // ==========================================
        // KNOWLEDGE REJECT
        // ==========================================

        if (customId.startsWith("knowledge_reject_")) {
            const knowledgeId = customId.replace(
                "knowledge_reject_",
                ""
            );

            try {
                if (
                    !interaction.member.permissions.has(
                        PermissionFlagsBits.ManageGuild
                    )
                ) {
                    return interaction.reply({
                        content:
                            "❌ Only server managers can verify knowledge.",
                        ephemeral: true
                    });
                }

                const result = await db.query(
                    `
                    DELETE FROM knowledge
                    WHERE id = $1
                    AND guild_id = $2
                    AND approved = FALSE
                    RETURNING title
                    `,
                    [
                        knowledgeId,
                        interaction.guild.id
                    ]
                );

                if (result.rows.length === 0) {
                    return interaction.reply({
                        content:
                            "❌ This knowledge item is already verified, rejected, or no longer exists.",
                        ephemeral: true
                    });
                }

                const title = result.rows[0].title;

                const embed = new EmbedBuilder()
                    .setTitle("❌ Knowledge Rejected")
                    .setDescription(
                        "This information was rejected and has been removed from Resolve's knowledge system."
                    )
                    .addFields(
                        {
                            name: "📌 Title",
                            value: title,
                            inline: false
                        },
                        {
                            name: "👤 Rejected By",
                            value: `<@${interaction.user.id}>`,
                            inline: true
                        },
                        {
                            name: "🔐 Status",
                            value: "❌ Rejected",
                            inline: true
                        }
                    )
                    .setFooter({
                        text: "Resolve • Knowledge Verification"
                    })
                    .setTimestamp();

                await interaction.update({
                    embeds: [embed],
                    components: []
                });

                console.log(
                    `❌ Knowledge #${knowledgeId} rejected by ${interaction.user.tag}`
                );

                return;

            } catch (error) {
                console.error(
                    "❌ Knowledge rejection error:",
                    error
                );

                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content:
                            "❌ I couldn't reject this knowledge item.",
                        ephemeral: true
                    });
                }

                return;
            }
        }

        // ==========================================
        // TICKET PRIORITY BUTTONS
        // ==========================================

        if (customId.startsWith("ticket_priority_")) {

            const priority = customId.replace(
                "ticket_priority_",
                ""
            );

            const priorityNames = {
                low: "🟢 Low",
                normal: "🔵 Normal",
                high: "🟠 High",
                urgent: "🔴 Urgent"
            };

            if (!priorityNames[priority]) {
                return interaction.reply({
                    content: "❌ Invalid ticket priority.",
                    ephemeral: true
                });
            }

            try {

                // ==========================================
                // CHECK FOR EXISTING TICKET
                // ==========================================

                const existingTicket = await db.query(
                    `
                    SELECT *
                    FROM tickets
                    WHERE guild_id = $1
                    AND user_id = $2
                    AND status IN ('open', 'human')
                    LIMIT 1
                    `,
                    [
                        interaction.guild.id,
                        interaction.user.id
                    ]
                );

                if (existingTicket.rows.length > 0) {

                    const existing = existingTicket.rows[0];

                    return interaction.reply({
                        content:
                            existing.status === "human"
                                ? "❌ You already have a support ticket waiting for the Support Team."
                                : "❌ You already have an open support ticket.",
                        ephemeral: true
                    });
                }

                // ==========================================
                // GET SERVER SETTINGS
                // ==========================================

                const settingsResult = await db.query(
                    `
                    SELECT support_role_id, ticket_category_id
                    FROM guild_settings
                    WHERE guild_id = $1
                    LIMIT 1
                    `,
                    [interaction.guild.id]
                );

                if (settingsResult.rows.length === 0) {
                    return interaction.reply({
                        content:
                            "❌ This server hasn't been set up yet. An administrator needs to run `/setup` first.",
                        ephemeral: true
                    });
                }

                const settings = settingsResult.rows[0];

                const supportRole =
                    interaction.guild.roles.cache.get(
                        settings.support_role_id
                    );

                const category =
                    interaction.guild.channels.cache.get(
                        settings.ticket_category_id
                    );

                if (!category) {
                    return interaction.reply({
                        content:
                            "❌ The configured ticket category could not be found.",
                        ephemeral: true
                    });
                }

                await interaction.deferReply({
                    ephemeral: true
                });

                // ==========================================
                // CREATE TICKET CHANNEL
                // ==========================================

                const ticketChannel =
                    await interaction.guild.channels.create({
                        name: `ticket-${interaction.user.username}`,
                        type: ChannelType.GuildText,
                        parent: category.id,

                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [
                                    PermissionFlagsBits.ViewChannel
                                ]
                            },
                            {
                                id: interaction.user.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ReadMessageHistory
                                ]
                            },
                            ...(supportRole
                                ? [
                                    {
                                        id: supportRole.id,
                                        allow: [
                                            PermissionFlagsBits.ViewChannel,
                                            PermissionFlagsBits.SendMessages,
                                            PermissionFlagsBits.ReadMessageHistory
                                        ]
                                    }
                                ]
                                : [])
                        ]
                    });

                // ==========================================
                // SAVE TICKET
                // ==========================================

                await db.query(
                    `
                    INSERT INTO tickets (
                        guild_id,
                        channel_id,
                        user_id,
                        status,
                        priority
                    )
                    VALUES ($1, $2, $3, 'open', $4)
                    `,
                    [
                        interaction.guild.id,
                        ticketChannel.id,
                        interaction.user.id,
                        priority
                    ]
                );

                // ==========================================
                // TICKET EMBED
                // ==========================================

                const embed = new EmbedBuilder()
                    .setTitle("🎫 Support Ticket")
                    .setDescription(
                        `Welcome <@${interaction.user.id}>!\n\n` +
                        "Resolve AI is now available to help with your issue.\n\n" +
                        `**Priority:** ${priorityNames[priority]}\n\n` +
                        "Please describe your issue below."
                    )
                    .addFields(
                        {
                            name: "🤖 Resolve AI",
                            value:
                                "Resolve will try to help first. If human support is required, the ticket will remain open and the Support Team will be notified.",
                            inline: false
                        },
                        {
                            name: "👤 Human Support",
                            value:
                                "A Support Team member can claim the ticket at any time.",
                            inline: false
                        }
                    )
                    .setFooter({
                        text: "Resolve • AI Support"
                    })
                    .setTimestamp();

                // ==========================================
                // TICKET BUTTONS
                // ==========================================

                const buttons =
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("ticket_claim")
                            .setLabel("Claim")
                            .setEmoji("👤")
                            .setStyle(ButtonStyle.Primary),

                        new ButtonBuilder()
                            .setCustomId("ticket_close")
                            .setLabel("Close")
                            .setEmoji("🔒")
                            .setStyle(ButtonStyle.Danger)
                    );

                // ==========================================
                // SEND TICKET MESSAGE
                // ==========================================

                await ticketChannel.send({
                    content:
                        `<@${interaction.user.id}>` +
                        (supportRole
                            ? ` <@&${supportRole.id}>`
                            : ""),
                    embeds: [embed],
                    components: [buttons]
                });

                await interaction.editReply({
                    content:
                        `✅ Your ticket has been created: ${ticketChannel}`
                });

                console.log(
                    `🎫 Ticket created: ${ticketChannel.name} | Priority: ${priority}`
                );

                return;

            } catch (error) {
                console.error(
                    "❌ Ticket creation error:",
                    error
                );

                if (interaction.deferred) {
                    await interaction.editReply({
                        content:
                            "❌ I couldn't create your ticket. Please try again."
                    });
                } else {
                    await interaction.reply({
                        content:
                            "❌ I couldn't create your ticket. Please try again.",
                        ephemeral: true
                    });
                }

                return;
            }
        }

        // ==========================================
        // TICKET CLAIM
        // ==========================================

        if (customId === "ticket_claim") {

            try {

                // IMPORTANT:
                // Tickets in BOTH open and human states
                // can be claimed.
                const ticketResult = await db.query(
                    `
                    SELECT *
                    FROM tickets
                    WHERE channel_id = $1
                    AND status IN ('open', 'human')
                    LIMIT 1
                    `,
                    [interaction.channel.id]
                );

                if (ticketResult.rows.length === 0) {
                    return interaction.reply({
                        content:
                            "❌ This ticket is already closed.",
                        ephemeral: true
                    });
                }

                const ticket = ticketResult.rows[0];

                // ==========================================
                // GET SUPPORT ROLE
                // ==========================================

                const settingsResult = await db.query(
                    `
                    SELECT support_role_id
                    FROM guild_settings
                    WHERE guild_id = $1
                    LIMIT 1
                    `,
                    [interaction.guild.id]
                );

                const supportRoleId =
                    settingsResult.rows[0]?.support_role_id;

                const isSupport =
                    supportRoleId &&
                    interaction.member.roles.cache.has(
                        supportRoleId
                    );

                const isAdmin =
                    interaction.member.permissions.has(
                        PermissionFlagsBits.ManageGuild
                    );

                if (!isSupport && !isAdmin) {
                    return interaction.reply({
                        content:
                            "❌ Only the Support Team can claim tickets.",
                        ephemeral: true
                    });
                }

                // ==========================================
                // CHECK IF ALREADY CLAIMED
                // ==========================================

                if (ticket.claimed_by) {
                    return interaction.reply({
                        content:
                            `❌ This ticket is already claimed by <@${ticket.claimed_by}>.`,
                        ephemeral: true
                    });
                }

                // ==========================================
                // CLAIM TICKET
                // ==========================================

                await db.query(
                    `
                    UPDATE tickets
                    SET claimed_by = $1,
                        status = 'human'
                    WHERE id = $2
                    AND status IN ('open', 'human')
                    `,
                    [
                        interaction.user.id,
                        ticket.id
                    ]
                );

                // ==========================================
                // CLAIM EMBED
                // ==========================================

                const embed = new EmbedBuilder()
                    .setTitle("👤 Ticket Claimed")
                    .setDescription(
                        `This ticket has been claimed by <@${interaction.user.id}>.\n\n` +
                        "🤖 Resolve AI support has been paused.\n" +
                        "👤 Human support is now handling this ticket."
                    )
                    .setFooter({
                        text: "Resolve • Human Support"
                    })
                    .setTimestamp();

                await interaction.reply({
                    embeds: [embed]
                });

                console.log(
                    `👤 Ticket ${ticket.id} claimed by ${interaction.user.tag}`
                );

                return;

            } catch (error) {
                console.error(
                    "❌ Claim error:",
                    error
                );

                if (!interaction.replied) {
                    await interaction.reply({
                        content:
                            "❌ I couldn't claim this ticket.",
                        ephemeral: true
                    });
                }

                return;
            }
        }

        // ==========================================
        // TICKET CLOSE
        // ==========================================

        if (customId === "ticket_close") {

            try {

                const ticketResult = await db.query(
                    `
                    SELECT *
                    FROM tickets
                    WHERE channel_id = $1
                    AND status IN ('open', 'human')
                    LIMIT 1
                    `,
                    [interaction.channel.id]
                );

                if (ticketResult.rows.length === 0) {
                    return interaction.reply({
                        content:
                            "❌ This ticket is already closed.",
                        ephemeral: true
                    });
                }

                const ticket = ticketResult.rows[0];

                // ==========================================
                // GET SUPPORT ROLE
                // ==========================================

                const settingsResult = await db.query(
                    `
                    SELECT support_role_id
                    FROM guild_settings
                    WHERE guild_id = $1
                    LIMIT 1
                    `,
                    [interaction.guild.id]
                );

                const supportRoleId =
                    settingsResult.rows[0]?.support_role_id;

                const isSupport =
                    supportRoleId &&
                    interaction.member.roles.cache.has(
                        supportRoleId
                    );

                const isAdmin =
                    interaction.member.permissions.has(
                        PermissionFlagsBits.ManageGuild
                    );

                const isOwner =
                    interaction.user.id === ticket.user_id;

                if (!isSupport && !isAdmin && !isOwner) {
                    return interaction.reply({
                        content:
                            "❌ You don't have permission to close this ticket.",
                        ephemeral: true
                    });
                }

                // ==========================================
                // CLOSE DATABASE TICKET
                // ==========================================

                await db.query(
                    `
                    UPDATE tickets
                    SET status = 'closed',
                        closed_at = NOW()
                    WHERE id = $1
                    `,
                    [ticket.id]
                );

                // ==========================================
                // CLOSED EMBED
                // ==========================================

                const closedEmbed = new EmbedBuilder()
                    .setTitle("🔒 Ticket Closed")
                    .setDescription(
                        `This ticket was closed by <@${interaction.user.id}>.\n\n` +
                        "Thank you for contacting Resolve Support."
                    )
                    .setFooter({
                        text: "Resolve • AI Support"
                    })
                    .setTimestamp();

                await interaction.reply({
                    embeds: [closedEmbed]
                });

                // ==========================================
                // HIDE TICKET FROM USER
                // ==========================================

                await interaction.channel.permissionOverwrites.edit(
                    ticket.user_id,
                    {
                        ViewChannel: false
                    }
                );

                // ==========================================
                // REMOVE BUTTONS
                // ==========================================

                await interaction.message.edit({
                    components: []
                });

                console.log(
                    `🔒 Ticket ${ticket.id} closed by ${interaction.user.tag}`
                );

                return;

            } catch (error) {
                console.error(
                    "❌ Close error:",
                    error
                );

                if (!interaction.replied) {
                    await interaction.reply({
                        content:
                            "❌ I couldn't close this ticket.",
                        ephemeral: true
                    });
                }

                return;
            }
        }
    }
};