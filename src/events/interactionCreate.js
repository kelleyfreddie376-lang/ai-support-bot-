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
        // ONLY HANDLE BUTTONS / MODALS
        // ==========================================

        if (!interaction.isButton() && !interaction.isModalSubmit()) {
            return;
        }

        const customId = interaction.customId;

        // ==========================================
        // SAVE ANSWER MODAL SUBMIT
        // IMPORTANT: THIS MUST BE BEFORE BUTTONS
        // ==========================================

        if (
            interaction.isModalSubmit() &&
            customId.startsWith("ticket_save_answer_modal_")
        ) {
            try {
                const ticketId = customId.replace(
                    "ticket_save_answer_modal_",
                    ""
                );

                const question =
                    interaction.fields
                        .getTextInputValue("knowledge_question")
                        .trim();

                const answer =
                    interaction.fields
                        .getTextInputValue("knowledge_answer")
                        .trim();

                if (!question || !answer) {
                    return interaction.reply({
                        content:
                            "❌ Both the question and answer are required.",
                        ephemeral: true
                    });
                }

                // ==========================================
                // FIND CLOSED TICKET
                // ==========================================

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
                            "❌ Only the Support Team or a server manager can save answers.",
                        ephemeral: true
                    });
                }

                // ==========================================
                // VALIDATE QUESTION
                // ==========================================

                if (question.length < 3) {
                    return interaction.reply({
                        content:
                            "❌ The question is too short.",
                        ephemeral: true
                    });
                }

                if (answer.length < 3) {
                    return interaction.reply({
                        content:
                            "❌ The answer is too short.",
                        ephemeral: true
                    });
                }

                // ==========================================
                // CHECK FOR DUPLICATE KNOWLEDGE
                // ==========================================

                const existingKnowledge = await db.query(
                    `
                    SELECT id
                    FROM knowledge
                    WHERE guild_id = $1
                    AND LOWER(title) = LOWER($2)
                    AND LOWER(content) = LOWER($3)
                    LIMIT 1
                    `,
                    [
                        interaction.guild.id,
                        question,
                        answer
                    ]
                );

                if (existingKnowledge.rows.length > 0) {
                    return interaction.reply({
                        content:
                            "ℹ️ This exact question and answer is already in Resolve's approved knowledge.",
                        ephemeral: true
                    });
                }

                // ==========================================
                // SAVE KNOWLEDGE
                // ==========================================

                const client = await db.connect();

                try {
                    await client.query("BEGIN");

                    await client.query(
                        `
                        INSERT INTO knowledge (
                            guild_id,
                            title,
                            content,
                            created_by,
                            approved,
                            updated_at
                        )
                        VALUES (
                            $1,
                            $2,
                            $3,
                            $4,
                            TRUE,
                            NOW()
                        )
                        `,
                        [
                            interaction.guild.id,
                            question,
                            answer,
                            interaction.user.id
                        ]
                    );

                    await client.query(
                        `
                        INSERT INTO approved_answers (
                            guild_id,
                            question,
                            answer,
                            approved_by
                        )
                        VALUES (
                            $1,
                            $2,
                            $3,
                            $4
                        )
                        `,
                        [
                            interaction.guild.id,
                            question,
                            answer,
                            interaction.user.id
                        ]
                    );

                    await client.query("COMMIT");

                } catch (databaseError) {
                    await client.query("ROLLBACK");
                    throw databaseError;

                } finally {
                    client.release();
                }

                // ==========================================
                // SUCCESS EMBED
                // ==========================================

                const savedEmbed =
                    new EmbedBuilder()
                        .setColor(0x57F287)
                        .setTitle("🧠 Answer Saved Successfully")
                        .setDescription(
                            "Resolve has added this answer to the server's approved AI knowledge."
                        )
                        .addFields(
                            {
                                name: "❓ Question",
                                value: question,
                                inline: false
                            },
                            {
                                name: "💡 Approved Answer",
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
                                name: "🔐 Knowledge Status",
                                value: "✅ Approved",
                                inline: true
                            }
                        )
                        .setFooter({
                            text:
                                "Resolve • AI Knowledge"
                        })
                        .setTimestamp();

                console.log(
                    `🧠 Knowledge saved for ticket #${ticketId} by ${interaction.user.tag}`
                );

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
                            "❌ I couldn't save this answer. Check the bot console logs for the exact database error.",
                        ephemeral: true
                    });
                }

                return;
            }
        }

        // ==========================================
        // KNOWLEDGE APPROVE
        // ==========================================

        if (
            interaction.isButton() &&
            customId.startsWith("knowledge_approve_")
        ) {
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
                            value:
                                `<@${interaction.user.id}>`,
                            inline: true
                        },
                        {
                            name: "🔐 Status",
                            value: "✅ Verified",
                            inline: true
                        }
                    )
                    .setFooter({
                        text:
                            "Resolve • Knowledge Verification"
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

                if (
                    !interaction.replied &&
                    !interaction.deferred
                ) {
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

        if (
            interaction.isButton() &&
            customId.startsWith("knowledge_reject_")
        ) {
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
                            "❌ Only server managers can reject knowledge.",
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
                            value:
                                `<@${interaction.user.id}>`,
                            inline: true
                        },
                        {
                            name: "🔐 Status",
                            value: "❌ Rejected",
                            inline: true
                        }
                    )
                    .setFooter({
                        text:
                            "Resolve • Knowledge Verification"
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

                if (
                    !interaction.replied &&
                    !interaction.deferred
                ) {
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

        if (
            interaction.isButton() &&
            customId.startsWith("ticket_priority_")
        ) {
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
                    content:
                        "❌ Invalid ticket priority.",
                    ephemeral: true
                });
            }

            try {
                const existingTicket =
                    await db.query(
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

                if (
                    existingTicket.rows.length > 0
                ) {
                    const existingChannel =
                        interaction.guild.channels.cache.get(
                            existingTicket.rows[0].channel_id
                        );

                    if (existingChannel) {
                        return interaction.reply({
                            content:
                                `❌ You already have an open ticket: ${existingChannel}`,
                            ephemeral: true
                        });
                    }

                    await db.query(
                        `
                        DELETE FROM tickets
                        WHERE id = $1
                        `,
                        [
                            existingTicket.rows[0].id
                        ]
                    );
                }

                const settingsResult =
                    await db.query(
                        `
                        SELECT
                            support_role_id,
                            ticket_category_id
                        FROM guild_settings
                        WHERE guild_id = $1
                        LIMIT 1
                        `,
                        [interaction.guild.id]
                    );

                const settings =
                    settingsResult.rows[0];

                if (!settings) {
                    return interaction.reply({
                        content:
                            "❌ This server hasn't been set up yet. Ask a server manager to run `/setup`.",
                        ephemeral: true
                    });
                }

                const supportRole =
                    settings.support_role_id
                        ? interaction.guild.roles.cache.get(
                            settings.support_role_id
                        )
                        : null;

                const category =
                    settings.ticket_category_id
                        ? interaction.guild.channels.cache.get(
                            settings.ticket_category_id
                        )
                        : null;

                const permissionOverwrites = [
                    {
                        id:
                            interaction.guild.roles.everyone.id,
                        deny: [
                            PermissionFlagsBits.ViewChannel
                        ]
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks
                        ]
                    }
                ];

                if (supportRole) {
                    permissionOverwrites.push({
                        id: supportRole.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks
                        ]
                    });
                }

                const channel =
                    await interaction.guild.channels.create({
                        name:
                            `ticket-${interaction.user.username}`
                                .toLowerCase()
                                .replace(
                                    /[^a-z0-9-]/g,
                                    ""
                                )
                                .slice(0, 80),
                        type: ChannelType.GuildText,
                        parent:
                            category &&
                            category.type ===
                                ChannelType.GuildCategory
                                ? category.id
                                : null,
                        permissionOverwrites
                    });

                const ticketResult =
                    await db.query(
                        `
                        INSERT INTO tickets (
                            guild_id,
                            channel_id,
                            user_id,
                            status,
                            priority
                        )
                        VALUES (
                            $1,
                            $2,
                            $3,
                            'open',
                            $4
                        )
                        RETURNING id
                        `,
                        [
                            interaction.guild.id,
                            channel.id,
                            interaction.user.id,
                            priority
                        ]
                    );

                const ticketId =
                    ticketResult.rows[0].id;

                const welcomeEmbed =
                    new EmbedBuilder()
                        .setColor(
                            priorityColors[priority]
                        )
                        .setTitle(
                            "🎫 Resolve Support Ticket"
                        )
                        .setDescription(
                            `Welcome <@${interaction.user.id}>!\n\n` +
                            `Your **${priorityNames[priority]}** priority ticket has been created.\n\n` +
                            `🤖 **Resolve AI** is reviewing your question.\n` +
                            `👥 If Resolve cannot confidently answer, the **Support Team** will be notified.\n\n` +
                            `Please explain your issue clearly so we can help you faster.`
                        )
                        .addFields(
                            {
                                name: "📊 Priority",
                                value:
                                    priorityNames[priority],
                                inline: true
                            },
                            {
                                name: "📌 Status",
                                value:
                                    "🤖 AI Reviewing",
                                inline: true
                            }
                        )
                        .setFooter({
                            text:
                                `Resolve • Ticket #${ticketId}`
                        })
                        .setTimestamp();

                const ticketButtons =
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `ticket_claim_${ticketId}`
                            )
                            .setLabel("Claim")
                            .setEmoji("🙋")
                            .setStyle(
                                ButtonStyle.Primary
                            ),

                        new ButtonBuilder()
                            .setCustomId(
                                `ticket_close_${ticketId}`
                            )
                            .setLabel("Close")
                            .setEmoji("🔒")
                            .setStyle(
                                ButtonStyle.Danger
                            )
                    );

                const welcomeMessage =
                    await channel.send({
                        content:
                            `<@${interaction.user.id}>` +
                            (
                                supportRole
                                    ? ` ${supportRole}`
                                    : ""
                            ),
                        embeds: [
                            welcomeEmbed
                        ],
                        components: [
                            ticketButtons
                        ]
                    });

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

                await awardAchievement(
                    interaction.guild,
                    interaction.user.id,
                    "first_ticket"
                );

                await interaction.reply({
                    content:
                        `🎫 Your ticket has been created: ${channel}`,
                    ephemeral: true
                });

                console.log(
                    `🎫 Ticket #${ticketId} created by ${interaction.user.tag} (${priority})`
                );

                return;

            } catch (error) {
                console.error(
                    "❌ Ticket creation error:",
                    error
                );

                if (
                    !interaction.replied &&
                    !interaction.deferred
                ) {
                    return interaction.reply({
                        content:
                            "❌ I couldn't create your ticket. Please try again.",
                        ephemeral: true
                    });
                }

                return;
            }
        }

        // ==========================================
        // CLAIM TICKET
        // ==========================================

        if (
            interaction.isButton() &&
            customId.startsWith("ticket_claim_")
        ) {
            try {
                const ticketId =
                    customId.replace(
                        "ticket_claim_",
                        ""
                    );

                const ticketResult =
                    await db.query(
                        `
                        SELECT *
                        FROM tickets
                        WHERE id = $1
                        AND guild_id = $2
                        LIMIT 1
                        `,
                        [
                            ticketId,
                            interaction.guild.id
                        ]
                    );

                if (
                    ticketResult.rows.length === 0
                ) {
                    return interaction.reply({
                        content:
                            "❌ This ticket no longer exists.",
                        ephemeral: true
                    });
                }

                const ticket =
                    ticketResult.rows[0];

                if (ticket.status === "closed") {
                    return interaction.reply({
                        content:
                            "❌ This ticket is already closed.",
                        ephemeral: true
                    });
                }

                const settingsResult =
                    await db.query(
                        `
                        SELECT support_role_id
                        FROM guild_settings
                        WHERE guild_id = $1
                        LIMIT 1
                        `,
                        [interaction.guild.id]
                    );

                const supportRoleId =
                    settingsResult.rows[0]
                        ?.support_role_id;

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
                            "❌ Only the Support Team or server managers can claim tickets.",
                        ephemeral: true
                    });
                }

                if (ticket.claimed_by) {
                    return interaction.reply({
                        content:
                            `❌ This ticket has already been claimed by <@${ticket.claimed_by}>.`,
                        ephemeral: true
                    });
                }

                await db.query(
                    `
                    UPDATE tickets
                    SET claimed_by = $1,
                        status = 'human'
                    WHERE id = $2
                    `,
                    [
                        interaction.user.id,
                        ticketId
                    ]
                );

                const claimedEmbed =
                    new EmbedBuilder()
                        .setColor(0x5865F2)
                        .setTitle(
                            "🙋 Ticket Claimed"
                        )
                        .setDescription(
                            `This ticket is now being handled by <@${interaction.user.id}>.\n\n` +
                            `🤖 Resolve AI has stepped back so the Support Team can take over.`
                        )
                        .addFields(
                            {
                                name: "👤 Claimed By",
                                value:
                                    `<@${interaction.user.id}>`,
                                inline: true
                            },
                            {
                                name: "📌 Status",
                                value:
                                    "👥 Human Support",
                                inline: true
                            }
                        )
                        .setFooter({
                            text:
                                `Resolve • Ticket #${ticketId}`
                        })
                        .setTimestamp();

                await interaction.reply({
                    embeds: [
                        claimedEmbed
                    ]
                });

                // ==========================================
                // UPDATE ORIGINAL WELCOME EMBED
                // ==========================================

                if (ticket.welcome_message_id) {
                    try {
                        const welcomeMessage =
                            await interaction.channel.messages.fetch(
                                ticket.welcome_message_id
                            );

                        if (welcomeMessage) {
                            const originalEmbed =
                                welcomeMessage.embeds[0];

                            const updatedEmbed =
                                new EmbedBuilder(
                                    originalEmbed
                                )
                                    .setColor(0x5865F2)
                                    .setFields(
                                        {
                                            name:
                                                "📊 Priority",
                                            value:
                                                originalEmbed.fields.find(
                                                    field =>
                                                        field.name ===
                                                        "📊 Priority"
                                                )?.value ||
                                                "🔵 Normal",
                                            inline: true
                                        },
                                        {
                                            name:
                                                "📌 Status",
                                            value:
                                                "👥 Human Support",
                                            inline: true
                                        },
                                        {
                                            name:
                                                "🙋 Claimed By",
                                            value:
                                                `<@${interaction.user.id}>`,
                                            inline: true
                                        }
                                    );

                            await welcomeMessage.edit({
                                embeds: [
                                    updatedEmbed
                                ],
                                components: []
                            });
                        }
                    } catch (error) {
                        console.error(
                            "⚠️ Could not update ticket welcome message:",
                            error
                        );
                    }
                }

                console.log(
                    `🙋 Ticket #${ticketId} claimed by ${interaction.user.tag}`
                );

                return;

            } catch (error) {
                console.error(
                    "❌ Ticket claim error:",
                    error
                );

                if (
                    !interaction.replied &&
                    !interaction.deferred
                ) {
                    return interaction.reply({
                        content:
                            "❌ I couldn't claim this ticket.",
                        ephemeral: true
                    });
                }

                return;
            }
        }

        // ==========================================
        // CLOSE TICKET
        // ==========================================

        if (
            interaction.isButton() &&
            customId.startsWith("ticket_close_")
        ) {
            try {
                const ticketId =
                    customId.replace(
                        "ticket_close_",
                        ""
                    );

                const ticketResult =
                    await db.query(
                        `
                        SELECT *
                        FROM tickets
                        WHERE id = $1
                        AND guild_id = $2
                        LIMIT 1
                        `,
                        [
                            ticketId,
                            interaction.guild.id
                        ]
                    );

                if (
                    ticketResult.rows.length === 0
                ) {
                    return interaction.reply({
                        content:
                            "❌ This ticket no longer exists.",
                        ephemeral: true
                    });
                }

                const ticket =
                    ticketResult.rows[0];

                if (ticket.status === "closed") {
                    return interaction.reply({
                        content:
                            "❌ This ticket is already closed.",
                        ephemeral: true
                    });
                }

                const settingsResult =
                    await db.query(
                        `
                        SELECT support_role_id
                        FROM guild_settings
                        WHERE guild_id = $1
                        LIMIT 1
                        `,
                        [interaction.guild.id]
                    );

                const supportRoleId =
                    settingsResult.rows[0]
                        ?.support_role_id;

                const isSupport =
                    supportRoleId &&
                    interaction.member.roles.cache.has(
                        supportRoleId
                    );

                const isAdmin =
                    interaction.member.permissions.has(
                        PermissionFlagsBits.ManageGuild
                    );

                const isTicketOwner =
                    interaction.user.id ===
                    ticket.user_id;

                if (
                    !isSupport &&
                    !isAdmin &&
                    !isTicketOwner
                ) {
                    return interaction.reply({
                        content:
                            "❌ Only the ticket owner, Support Team, or a server manager can close this ticket.",
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
                    [ticketId]
                );

                const closedEmbed =
                    new EmbedBuilder()
                        .setColor(0xED4245)
                        .setTitle(
                            "🔒 Ticket Closed"
                        )
                        .setDescription(
                            `This ticket has been closed by <@${interaction.user.id}>.\n\n` +
                            `If this ticket contained a useful solution, Support Team members can save the answer to Resolve's approved AI knowledge.`
                        )
                        .addFields(
                            {
                                name: "👤 Closed By",
                                value:
                                    `<@${interaction.user.id}>`,
                                inline: true
                            },
                            {
                                name: "📌 Status",
                                value:
                                    "🔒 Closed",
                                inline: true
                            }
                        )
                        .setFooter({
                            text:
                                `Resolve • Ticket #${ticketId}`
                        })
                        .setTimestamp();

                const closedButtons =
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `ticket_save_answer_${ticketId}`
                            )
                            .setLabel(
                                "Save Answer"
                            )
                            .setEmoji("🧠")
                            .setStyle(
                                ButtonStyle.Success
                            ),

                        new ButtonBuilder()
                            .setCustomId(
                                `ticket_delete_${ticketId}`
                            )
                            .setLabel(
                                "Delete Ticket"
                            )
                            .setEmoji("🗑️")
                            .setStyle(
                                ButtonStyle.Danger
                            )
                    );

                await interaction.reply({
                    embeds: [
                        closedEmbed
                    ],
                    components: [
                        closedButtons
                    ]
                });

                console.log(
                    `🔒 Ticket #${ticketId} closed by ${interaction.user.tag}`
                );

                return;

            } catch (error) {
                console.error(
                    "❌ Ticket close error:",
                    error
                );

                if (
                    !interaction.replied &&
                    !interaction.deferred
                ) {
                    return interaction.reply({
                        content:
                            "❌ I couldn't close this ticket.",
                        ephemeral: true
                    });
                }

                return;
            }
        }

        // ==========================================
        // SAVE ANSWER BUTTON
        // ==========================================

        if (
            interaction.isButton() &&
            customId.startsWith("ticket_save_answer_")
        ) {
            try {
                const ticketId =
                    customId.replace(
                        "ticket_save_answer_",
                        ""
                    );

                // ==========================================
                // FIND TICKET
                // ==========================================

                const ticketResult =
                    await db.query(
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

                if (
                    ticketResult.rows.length === 0
                ) {
                    return interaction.reply({
                        content:
                            "❌ This closed ticket could not be found.",
                        ephemeral: true
                    });
                }

                // ==========================================
                // PERMISSIONS
                // ==========================================

                const settingsResult =
                    await db.query(
                        `
                        SELECT support_role_id
                        FROM guild_settings
                        WHERE guild_id = $1
                        LIMIT 1
                        `,
                        [interaction.guild.id]
                    );

                const supportRoleId =
                    settingsResult.rows[0]
                        ?.support_role_id;

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
                            "❌ Only the Support Team or a server manager can save answers.",
                        ephemeral: true
                    });
                }

                // ==========================================
                // GET TICKET MESSAGES
                // ==========================================

                const messagesResult =
                    await db.query(
                        `
                        SELECT
                            user_id,
                            content,
                            is_staff,
                            created_at
                        FROM ticket_messages
                        WHERE ticket_id = $1
                        ORDER BY created_at ASC
                        `,
                        [ticketId]
                    );

                const messages =
                    messagesResult.rows;

                if (messages.length === 0) {
                    return interaction.reply({
                        content:
                            "❌ There are no saved messages for this ticket yet.",
                        ephemeral: true
                    });
                }

                // ==========================================
                // FIND USER QUESTION
                // ==========================================

                const firstUserMessage =
                    messages.find(
                        message =>
                            !message.is_staff &&
                            message.content &&
                            message.content.trim().length > 0
                    );

                // ==========================================
                // FIND LAST STAFF ANSWER
                // ==========================================

                const staffMessages =
                    messages.filter(
                        message =>
                            message.is_staff &&
                            message.content &&
                            message.content.trim().length > 0
                    );

                const lastStaffMessage =
                    staffMessages[
                        staffMessages.length - 1
                    ];

                if (
                    !firstUserMessage ||
                    !lastStaffMessage
                ) {
                    return interaction.reply({
                        content:
                            "❌ I couldn't find both a user question and a staff answer in this ticket.",
                        ephemeral: true
                    });
                }

                // ==========================================
                // LIMIT MODAL VALUES
                // Discord text inputs have a maximum length.
                // ==========================================

                const question =
                    firstUserMessage.content
                        .trim()
                        .slice(0, 1000);

                const answer =
                    lastStaffMessage.content
                        .trim()
                        .slice(0, 4000);

                // ==========================================
                // CREATE SAVE MODAL
                // ==========================================

                const modal =
                    new ModalBuilder()
                        .setCustomId(
                            `ticket_save_answer_modal_${ticketId}`
                        )
                        .setTitle(
                            "🧠 Save Answer"
                        );

                const questionInput =
                    new TextInputBuilder()
                        .setCustomId(
                            "knowledge_question"
                        )
                        .setLabel(
                            "What was the user's question?"
                        )
                        .setStyle(
                            TextInputStyle.Paragraph
                        )
                        .setRequired(true)
                        .setMaxLength(1000)
                        .setValue(question);

                const answerInput =
                    new TextInputBuilder()
                        .setCustomId(
                            "knowledge_answer"
                        )
                        .setLabel(
                            "What is the correct answer?"
                        )
                        .setStyle(
                            TextInputStyle.Paragraph
                        )
                        .setRequired(true)
                        .setMaxLength(4000)
                        .setValue(answer);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        questionInput
                    ),
                    new ActionRowBuilder().addComponents(
                        answerInput
                    )
                );

                return interaction.showModal(
                    modal
                );

            } catch (error) {
                console.error(
                    "❌ Save answer button error:",
                    error
                );

                if (
                    !interaction.replied &&
                    !interaction.deferred
                ) {
                    return interaction.reply({
                        content:
                            "❌ I couldn't open the Save Answer form.",
                        ephemeral: true
                    });
                }

                return;
            }
        }

        // ==========================================
        // DELETE CLOSED TICKET
        // ==========================================

        if (
            interaction.isButton() &&
            customId.startsWith("ticket_delete_")
        ) {
            try {
                const ticketId =
                    customId.replace(
                        "ticket_delete_",
                        ""
                    );

                const ticketResult =
                    await db.query(
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

                if (
                    ticketResult.rows.length === 0
                ) {
                    return interaction.reply({
                        content:
                            "❌ This ticket could not be found or is not closed.",
                        ephemeral: true
                    });
                }

                const ticket =
                    ticketResult.rows[0];

                const settingsResult =
                    await db.query(
                        `
                        SELECT support_role_id
                        FROM guild_settings
                        WHERE guild_id = $1
                        LIMIT 1
                        `,
                        [interaction.guild.id]
                    );

                const supportRoleId =
                    settingsResult.rows[0]
                        ?.support_role_id;

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
                            "❌ Only the Support Team or a server manager can delete closed tickets.",
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
                    return interaction.reply({
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