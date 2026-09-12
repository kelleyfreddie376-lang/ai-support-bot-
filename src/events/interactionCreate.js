const {
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

const commands = require("../commands");
const db = require("../database/db");
const { awardAchievement } = require("../services/achievements");

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
        // BUTTONS / MODALS
        // ==========================================

        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

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
                    .setColor(0x57F287)
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
                    .setColor(0xED4245)
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

            const priorityColors = {
                low: 0x57F287,
                normal: 0x5865F2,
                high: 0xFEE75C,
                urgent: 0xED4245
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

                const ticketResult = await db.query(
                    `
                    INSERT INTO tickets (
                        guild_id,
                        channel_id,
                        user_id,
                        status,
                        priority
                    )
                    VALUES ($1, $2, $3, 'open', $4)
                    RETURNING id
                    `,
                    [
                        interaction.guild.id,
                        ticketChannel.id,
                        interaction.user.id,
                        priority
                    ]
                );

                const ticketId = ticketResult.rows[0].id;

                // ==========================================
                // TICKET EMBED
                // ==========================================

                const embed = new EmbedBuilder()
                    .setColor(priorityColors[priority])
                    .setTitle("🎫 Resolve Support Ticket")
                    .setDescription(
                        `Welcome <@${interaction.user.id}>! 👋\n\n` +
                        "Your private support ticket is ready.\n" +
                        "Resolve AI will review your message using the server's verified knowledge.\n\n" +
                        "If Resolve cannot confidently answer your question, a Support Team member can take over."
                    )
                    .addFields(
                        {
                            name: "🆔 Ticket ID",
                            value: `#${ticketId}`,
                            inline: true
                        },
                        {
                            name: "📊 Priority",
                            value: priorityNames[priority],
                            inline: true
                        },
                        {
                            name: "📌 Status",
                            value: "🤖 AI Support Active",
                            inline: true
                        },
                        {
                            name: "🤖 Resolve AI",
                            value:
                                "I'll use verified server knowledge to help answer your question. I won't guess when the information isn't available.",
                            inline: false
                        },
                        {
                            name: "👤 Human Support",
                            value:
                                "Support Team members can claim this ticket whenever human assistance is needed.",
                            inline: false
                        },
                        {
                            name: "📝 What to do next",
                            value:
                                "Describe your issue clearly in your next message. Include relevant details so Resolve can help you faster.",
                            inline: false
                        }
                    )
                    .setFooter({
                        text: `Resolve • ${priorityNames[priority]} Priority`
                    })
                    .setTimestamp();

                // ==========================================
                // TICKET BUTTONS
                // ==========================================

                const buttons =
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("ticket_claim")
                            .setLabel("Claim Ticket")
                            .setEmoji("👤")
                            .setStyle(ButtonStyle.Primary),

                        new ButtonBuilder()
                            .setCustomId("ticket_close")
                            .setLabel("Close Ticket")
                            .setEmoji("🔒")
                            .setStyle(ButtonStyle.Danger)
                    );

                // ==========================================
                // SEND TICKET MESSAGE
                // ==========================================

                const welcomeMessage =
                    await ticketChannel.send({
                        content:
                            `<@${interaction.user.id}>` +
                            (supportRole
                                ? ` <@&${supportRole.id}>`
                                : ""),
                        embeds: [embed],
                        components: [buttons]
                    });

                // Save the welcome message ID so Resolve
                // can update the original ticket embed later.
                await db.query(
                    `
                    UPDATE tickets
                    SET welcome_message_id = $1
                    WHERE id = $2
                    `,
                    [
                        welcomeMessage.id,
                        ticketId
                    ]
                );

                await interaction.editReply({
                    content:
                        `✅ Your ticket has been created: ${ticketChannel}\n` +
                        `🎫 Ticket ID: **#${ticketId}**\n` +
                        `📊 Priority: **${priorityNames[priority]}**`
                });

                // ==========================================
                // FIRST TICKET ACHIEVEMENT
                // ==========================================

                await awardAchievement({
                    guild: interaction.guild,
                    userId: interaction.user.id,
                    key: "first_ticket",
                    name: "First Ticket",
                    description:
                        "You opened your first support ticket with Resolve!",
                    emoji: "🎫"
                });

                console.log(
                    `🎫 Ticket #${ticketId} created: ${ticketChannel.name} | Priority: ${priority}`
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

                if (ticket.claimed_by) {
                    return interaction.reply({
                        content:
                            `❌ This ticket is already claimed by <@${ticket.claimed_by}>.`,
                        ephemeral: true
                    });
                }

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

                const embed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle("👤 Ticket Claimed")
                    .setDescription(
                        `This ticket has been claimed by <@${interaction.user.id}>.\n\n` +
                        "🤖 Resolve AI support has been paused.\n" +
                        "👤 Human support is now handling this ticket."
                    )
                    .addFields({
                        name: "📊 Status",
                        value: "👤 Human Support Active",
                        inline: true
                    })
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

                await db.query(
                    `
                    UPDATE tickets
                    SET status = 'closed',
                        closed_at = NOW()
                    WHERE id = $1
                    `,
                    [ticket.id]
                );

                const closedEmbed = new EmbedBuilder()
                    .setColor(0xED4245)
                    .setTitle("🔒 Ticket Closed")
                    .setDescription(
                        `This ticket was closed by <@${interaction.user.id}>.\n\n` +
                        "Thank you for contacting Resolve Support!\n\n" +
                        "🧠 **Did Resolve learn something useful?**\n" +
                        "Support Team members can save the final question and answer to Resolve's approved knowledge before deleting this ticket."
                    )
                    .addFields(
                        {
                            name: "🎫 Ticket",
                            value: `#${ticket.id}`,
                            inline: true
                        },
                        {
                            name: "👤 Closed By",
                            value: `<@${interaction.user.id}>`,
                            inline: true
                        },
                        {
                            name: "📊 Status",
                            value: "🔒 Closed",
                            inline: true
                        }
                    )
                    .setFooter({
                        text: "Resolve • Ticket Closed"
                    })
                    .setTimestamp();

                // ==========================================
                // CLOSED TICKET BUTTONS
                // ==========================================

                const closedButtons =
                    new ActionRowBuilder().addComponents(

                        new ButtonBuilder()
                            .setCustomId(
                                `ticket_save_answer_${ticket.id}`
                            )
                            .setLabel("Save Answer")
                            .setEmoji("🧠")
                            .setStyle(ButtonStyle.Primary),

                        new ButtonBuilder()
                            .setCustomId(
                                `ticket_delete_${ticket.id}`
                            )
                            .setLabel("Delete Ticket")
                            .setEmoji("🗑️")
                            .setStyle(ButtonStyle.Danger)

                    );

                await interaction.reply({
                    embeds: [closedEmbed],
                    components: [closedButtons]
                });

                await interaction.channel.permissionOverwrites.edit(
                    ticket.user_id,
                    {
                        ViewChannel: false
                    }
                );

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

        // ==========================================
        // SAVE ANSWER FROM CLOSED TICKET
        // ==========================================

        if (customId.startsWith("ticket_save_answer_")) {

            try {

                const ticketId =
                    customId.replace(
                        "ticket_save_answer_",
                        ""
                    );

                const ticketResult = await db.query(
                    `
                    SELECT *
                    FROM tickets
                    WHERE id = $1
                    AND guild_id = $2
                    AND status = 'closed'
                    LIMIT 1
                    `,
                    [
                        ticketId,
                        interaction.guild.id
                    ]
                );

                if (ticketResult.rows.length === 0) {
                    return interaction.reply({
                        content:
                            "❌ This ticket could not be found or is not closed.",
                        ephemeral: true
                    });
                }

                const ticket = ticketResult.rows[0];

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
                            "❌ Only the Support Team can save answers to Resolve's knowledge.",
                        ephemeral: true
                    });
                }

                // Get ticket conversation
                const messagesResult = await db.query(
                    `
                    SELECT user_id, content, is_staff
                    FROM ticket_messages
                    WHERE ticket_id = $1
                    ORDER BY created_at ASC
                    `,
                    [ticket.id]
                );

                const messages = messagesResult.rows;

                let suggestedQuestion = "";
                let suggestedAnswer = "";

                const firstUserMessage =
                    messages.find(
                        message => !message.is_staff
                    );

                const lastStaffMessage =
                    [...messages]
                        .reverse()
                        .find(
                            message => message.is_staff
                        );

                if (firstUserMessage) {
                    suggestedQuestion =
                        firstUserMessage.content.slice(
                            0,
                            1000
                        );
                }

                if (lastStaffMessage) {
                    suggestedAnswer =
                        lastStaffMessage.content.slice(
                            0,
                            4000
                        );
                }

                // ==========================================
                // SAVE ANSWER MODAL
                // ==========================================

                const modal =
                    new ModalBuilder()
                        .setCustomId(
                            `ticket_save_answer_modal_${ticket.id}`
                        )
                        .setTitle(
                            "Save Answer to Resolve"
                        );

                const questionInput =
                    new TextInputBuilder()
                        .setCustomId(
                            "knowledge_question"
                        )
                        .setLabel("Question")
                        .setStyle(
                            TextInputStyle.Paragraph
                        )
                        .setRequired(true)
                        .setMaxLength(1000)
                        .setValue(
                            suggestedQuestion ||
                            "What was the user's question?"
                        );

                const answerInput =
                    new TextInputBuilder()
                        .setCustomId(
                            "knowledge_answer"
                        )
                        .setLabel("Correct Answer")
                        .setStyle(
                            TextInputStyle.Paragraph
                        )
                        .setRequired(true)
                        .setMaxLength(4000)
                        .setValue(
                            suggestedAnswer ||
                            "Enter the correct answer..."
                        );

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        questionInput
                    ),
                    new ActionRowBuilder().addComponents(
                        answerInput
                    )
                );

                await interaction.showModal(modal);

                return;

            } catch (error) {
                console.error(
                    "❌ Save answer button error:",
                    error
                );

                if (
                    !interaction.replied &&
                    !interaction.deferred
                ) {
                    await interaction.reply({
                        content:
                            "❌ I couldn't open the Save Answer form.",
                        ephemeral: true
                    });
                }

                return;
            }
        }

        // ==========================================
        // SAVE ANSWER MODAL SUBMIT
        // ==========================================

        if (
            interaction.isModalSubmit() &&
            customId.startsWith(
                "ticket_save_answer_modal_"
            )
        ) {

            try {

                const ticketId =
                    customId.replace(
                        "ticket_save_answer_modal_",
                        ""
                    );

                const question =
                    interaction.fields
                        .getTextInputValue(
                            "knowledge_question"
                        )
                        .trim();

                const answer =
                    interaction.fields
                        .getTextInputValue(
                            "knowledge_answer"
                        )
                        .trim();

                if (!question || !answer) {
                    return interaction.reply({
                        content:
                            "❌ Both the question and answer are required.",
                        ephemeral: true
                    });
                }

                const ticketResult = await db.query(
                    `
                    SELECT *
                    FROM tickets
                    WHERE id = $1
                    AND guild_id = $2
                    AND status = 'closed'
                    LIMIT 1
                    `,
                    [
                        ticketId,
                        interaction.guild.id
                    ]
                );

                if (ticketResult.rows.length === 0) {
                    return interaction.reply({
                        content:
                            "❌ This closed ticket could not be found.",
                        ephemeral: true
                    });
                }

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
                            "❌ Only the Support Team can save answers.",
                        ephemeral: true
                    });
                }

                // ==========================================
                // SAVE TO KNOWLEDGE
                // ==========================================

                await db.query(
                    `
                    INSERT INTO knowledge (
                        guild_id,
                        title,
                        content,
                        created_by,
                        approved
                    )
                    VALUES ($1, $2, $3, $4, TRUE)
                    `,
                    [
                        interaction.guild.id,
                        question,
                        answer,
                        interaction.user.id
                    ]
                );

                // ==========================================
                // SAVE APPROVED ANSWER
                // ==========================================

                await db.query(
                    `
                    INSERT INTO approved_answers (
                        guild_id,
                        question,
                        answer,
                        approved_by
                    )
                    VALUES ($1, $2, $3, $4)
                    `,
                    [
                        interaction.guild.id,
                        question,
                        answer,
                        interaction.user.id
                    ]
                );

                const savedEmbed =
                    new EmbedBuilder()
                        .setColor(0x57F287)
                        .setTitle("🧠 Answer Saved")
                        .setDescription(
                            "This answer has been approved and added to Resolve's server knowledge."
                        )
                        .addFields(
                            {
                                name: "❓ Question",
                                value: question,
                                inline: false
                            },
                            {
                                name: "💡 Answer",
                                value: answer,
                                inline: false
                            },
                            {
                                name: "👤 Saved By",
                                value:
                                    `<@${interaction.user.id}>`,
                                inline: true
                            },
                            {
                                name: "🔐 Status",
                                value: "✅ Approved",
                                inline: true
                            }
                        )
                        .setFooter({
                            text:
                                "Resolve • Approved Knowledge"
                        })
                        .setTimestamp();

                return interaction.reply({
                    embeds: [savedEmbed],
                    ephemeral: true
                });

            } catch (error) {
                console.error(
                    "❌ Save answer modal error:",
                    error
                );

                if (
                    !interaction.replied &&
                    !interaction.deferred
                ) {
                    return interaction.reply({
                        content:
                            "❌ I couldn't save this answer to Resolve's knowledge.",
                        ephemeral: true
                    });
                }

                return;
            }
        }

        // ==========================================
        // DELETE CLOSED TICKET
        // ==========================================

        if (customId.startsWith("ticket_delete_")) {

            try {

                const ticketId =
                    customId.replace(
                        "ticket_delete_",
                        ""
                    );

                const ticketResult = await db.query(
                    `
                    SELECT *
                    FROM tickets
                    WHERE id = $1
                    AND guild_id = $2
                    AND status = 'closed'
                    LIMIT 1
                    `,
                    [
                        ticketId,
                        interaction.guild.id
                    ]
                );

                if (ticketResult.rows.length === 0) {
                    return interaction.reply({
                        content:
                            "❌ This ticket could not be found or is not closed.",
                        ephemeral: true
                    });
                }

                const ticket = ticketResult.rows[0];

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
                            "❌ Only the Support Team can delete closed tickets.",
                        ephemeral: true
                    });
                }

                await interaction.reply({
                    content:
                        "🗑️ Deleting this ticket channel...",
                    ephemeral: true
                });

                console.log(
                    `🗑️ Ticket ${ticket.id} deleted by ${interaction.user.tag}`
                );

                await interaction.channel.delete(
                    `Resolve ticket #${ticket.id} deleted by ${interaction.user.tag}`
                );

                return;

            } catch (error) {
                console.error(
                    "❌ Delete ticket error:",
                    error
                );

                if (
                    !interaction.replied &&
                    !interaction.deferred
                ) {
                    await interaction.reply({
                        content:
                            "❌ I couldn't delete this ticket.",
                        ephemeral: true
                    });
                }

                return;
            }
        }
    }
};