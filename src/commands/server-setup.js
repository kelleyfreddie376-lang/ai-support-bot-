const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/db");

const SUPPORT_SERVER_ID = "1545866787059671100";

/*
 * Channels Resolve automatically learns from.
 */
const AUTO_KNOWLEDGE_CHANNELS = [
    "📜・rules",
    "🤖・about-resolve",
    "📢・announcements",
    "🚀・updates",
    "📝・changelog",
    "🎫・support",
    "❓・faq",
    "🏆・achievements",
    "🎉・events",
    "💡・suggestions",
    "🐛・bug-reports"
];

/*
 * Server categories and channels.
 */
const SERVER_STRUCTURE = {
    "📌 START HERE": [
        "👋・welcome",
        "📜・rules",
        "🤖・about-resolve",
        "🎭・reaction-roles",
        "🎨・colors"
    ],

    "📢 RESOLVE": [
        "📢・announcements",
        "🚀・updates",
        "📝・changelog"
    ],

    "🆘 SUPPORT": [
        "🎫・support",
        "❓・faq",
        "🐛・bug-reports",
        "💡・suggestions"
    ],

    "🏆 ACHIEVEMENTS": [
        "🏆・achievements",
        "📜・achievement-log"
    ],

    "💬 COMMUNITY": [
        "💬・general",
        "🎉・events",
        "🖼️・showcase"
    ],

    "🔒 STAFF": [
        "💬・staff-chat",
        "📋・staff-logs",
        "🛡️・staff-info",
        "📊・support-stats"
    ]
};

/*
 * Roles Resolve creates.
 */
const SERVER_ROLES = [
    {
        name: "🔧 Support Team",
        color: 0x5865F2
    },
    {
        name: "🛡️ Moderator",
        color: 0x57F287
    },
    {
        name: "📢 Announcements",
        color: 0xFEE75C
    },
    {
        name: "🚀 Updates",
        color: 0x5865F2
    },
    {
        name: "🐛 Bug Hunter",
        color: 0xED4245
    },
    {
        name: "💡 Idea Maker",
        color: 0xFEE75C
    },
    {
        name: "👋 Resolve Member",
        color: 0x57F287
    },
    {
        name: "🎫 First Ticket",
        color: 0x5865F2
    },
    {
        name: "🧠 Knowledge Seeker",
        color: 0x9B59B6
    },
    {
        name: "🤖 Resolve Explorer",
        color: 0x5865F2
    },
    {
        name: "💬 Community Member",
        color: 0x57F287
    },
    {
        name: "🏆 Support Veteran",
        color: 0xF1C40F
    },
    {
        name: "⭐ Support Legend",
        color: 0xE67E22
    },
    {
        name: "💎 Achievement Master",
        color: 0x9B59B6
    },
    {
        name: "👑 Resolve OG",
        color: 0xF1C40F
    }
];

/*
 * Permission helper.
 */
function canManageServer(interaction) {
    const ownerId = process.env.BOT_OWNER_ID;

    if (ownerId && interaction.user.id === ownerId) {
        return true;
    }

    return interaction.memberPermissions?.has(
        PermissionFlagsBits.Administrator
    );
}

/*
 * Find an existing category.
 */
function findCategory(guild, name) {
    return guild.channels.cache.find(
        channel =>
            channel.type === ChannelType.GuildCategory &&
            channel.name === name
    );
}

/*
 * Find an existing channel.
 */
function findChannel(guild, name) {
    return guild.channels.cache.find(
        channel =>
            channel.name === name &&
            channel.type === ChannelType.GuildText
    );
}

/*
 * Create a channel if it does not already exist.
 */
async function getOrCreateChannel(guild, name, category) {
    let channel = findChannel(guild, name);

    if (channel) {
        if (
            category &&
            channel.parentId !== category.id
        ) {
            await channel.setParent(category.id).catch(() => {});
        }

        return channel;
    }

    channel = await guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: category?.id || null
    });

    return channel;
}

/*
 * Create all required roles.
 */
async function createRoles(guild) {
    const created = [];

    for (const roleData of SERVER_ROLES) {
        let role = guild.roles.cache.find(
            existing =>
                existing.name === roleData.name
        );

        if (!role) {
            role = await guild.roles.create({
                name: roleData.name,
                color: roleData.color,
                reason: "Resolve Support Server Setup"
            });

            created.push(roleData.name);
        }
    }

    return created;
}

/*
 * Create/update the database records.
 */
async function setupDatabase(guild) {
    await db.query(
        `
        INSERT INTO guilds (
            guild_id,
            guild_name
        )
        VALUES ($1, $2)
        ON CONFLICT (guild_id)
        DO UPDATE SET
            guild_name = EXCLUDED.guild_name
        `,
        [
            guild.id,
            guild.name
        ]
    );

    await db.query(
        `
        INSERT INTO guild_settings (
            guild_id,
            ai_enabled
        )
        VALUES ($1, TRUE)
        ON CONFLICT (guild_id)
        DO NOTHING
        `,
        [guild.id]
    );

    /*
     * Make sure automatic knowledge has a source channel.
     */
    await db.query(`
        ALTER TABLE knowledge
        ADD COLUMN IF NOT EXISTS source_channel_id TEXT
    `);

    await db.query(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_source_channel
        ON knowledge(guild_id, source_channel_id)
    `);
}

/*
 * Automatically synchronize important channels.
 */
async function syncAutomaticKnowledge(guild) {
    let synced = 0;
    let skipped = 0;
    let messagesLearned = 0;

    console.log("🧠 Starting automatic knowledge sync...");

    for (const channelName of AUTO_KNOWLEDGE_CHANNELS) {
        try {
            const channel = findChannel(
                guild,
                channelName
            );

            if (!channel) {
                console.log(
                    `⚠️ Knowledge channel not found: ${channelName}`
                );

                skipped++;
                continue;
            }

            const permissions =
                channel.permissionsFor(
                    guild.members.me
                );

            if (
                !permissions?.has(
                    PermissionFlagsBits.ViewChannel
                ) ||
                !permissions?.has(
                    PermissionFlagsBits.ReadMessageHistory
                )
            ) {
                console.log(
                    `⚠️ Cannot read #${channelName}`
                );

                skipped++;
                continue;
            }

            /*
             * Remove old automatic knowledge for this channel.
             */
            await db.query(
                `
                DELETE FROM knowledge
                WHERE guild_id = $1
                AND source_channel_id = $2
                `,
                [
                    guild.id,
                    channel.id
                ]
            );

            const collected = [];
            let before;

            /*
             * Read up to 1000 messages.
             */
            while (collected.length < 1000) {
                const options = {
                    limit: 100
                };

                if (before) {
                    options.before = before;
                }

                const batch =
                    await channel.messages.fetch(
                        options
                    );

                if (batch.size === 0) {
                    break;
                }

                for (const message of batch.values()) {
                    if (message.author.bot) {
                        continue;
                    }

                    const parts = [];

                    if (message.content?.trim()) {
                        parts.push(
                            message.content.trim()
                        );
                    }

                    for (const embed of message.embeds) {
                        if (embed.title) {
                            parts.push(
                                `Title: ${embed.title}`
                            );
                        }

                        if (embed.description) {
                            parts.push(
                                embed.description
                            );
                        }

                        for (const field of embed.fields || []) {
                            parts.push(
                                `${field.name}: ${field.value}`
                            );
                        }
                    }

                    const content =
                        parts.join("\n").trim();

                    if (!content) {
                        continue;
                    }

                    collected.push({
                        content,
                        authorId:
                            message.author.id
                    });

                    if (
                        collected.length >= 1000
                    ) {
                        break;
                    }
                }

                before =
                    batch.last().id;

                if (batch.size < 100) {
                    break;
                }
            }

            /*
             * Oldest information first.
             */
            collected.reverse();

            /*
             * Store the channel as one knowledge source.
             */
            if (collected.length > 0) {
                let combined = "";

                for (const item of collected) {
                    const entry =
                        `\n${item.content}\n`;

                    /*
                     * Keep individual knowledge records
                     * at a reasonable size.
                     */
                    if (
                        combined.length +
                        entry.length >
                        50000
                    ) {
                        break;
                    }

                    combined += entry;
                }

                await db.query(
                    `
                    INSERT INTO knowledge (
                        guild_id,
                        title,
                        content,
                        created_by,
                        approved,
                        source_channel_id
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        TRUE,
                        $5
                    )
                    `,
                    [
                        guild.id,
                        `Automatic Knowledge • ${channelName}`,
                        combined.trim(),
                        guild.members.me?.id ||
                            guild.client.user.id,
                        channel.id
                    ]
                );

                messagesLearned +=
                    collected.length;
            }

            synced++;

            console.log(
                `🧠 Synced #${channelName} — ${collected.length} messages`
            );

        } catch (error) {
            skipped++;

            console.error(
                `❌ Failed to sync #${channelName}:`,
                error
            );
        }
    }

    console.log(
        `🧠 Knowledge sync complete: ${synced} channels, ${messagesLearned} messages learned.`
    );

    return {
        synced,
        skipped,
        messagesLearned
    };
}

/*
 * Send the main welcome message.
 */
async function setupWelcome(channel) {
    const embed = new EmbedBuilder()
        .setTitle("👋 Welcome to Resolve!")
        .setDescription(
            "Welcome to the official Resolve Support Server!\n\n" +
            "Resolve is an AI-powered support platform built to help Discord communities provide faster, smarter support."
        )
        .addFields(
            {
                name: "🤖 What is Resolve?",
                value:
                    "Resolve helps Discord servers manage support tickets, answer questions using approved knowledge, and connect users with human Support Teams when needed.",
                inline: false
            },
            {
                name: "🎫 Need Support?",
                value:
                    "Visit the support channels to get help with Resolve.",
                inline: true
            },
            {
                name: "📚 Learn More",
                value:
                    "Check the rules, FAQ, updates, announcements, and other information channels.",
                inline: true
            },
            {
                name: "🏆 Achievements",
                value:
                    "Participate in the community, use Resolve, open tickets, and unlock achievements.",
                inline: false
            }
        )
        .setFooter({
            text:
                "Resolve • AI-powered support for Discord"
        })
        .setTimestamp();

    await channel.send({
        embeds: [embed]
    });
}

/*
 * Setup rules.
 */
async function setupRules(channel) {
    const embed = new EmbedBuilder()
        .setTitle("📜 Resolve Community Rules")
        .setDescription(
            "Welcome to the official Resolve Support Server. Please follow these rules to keep the community helpful and welcoming."
        )
        .addFields(
            {
                name: "1️⃣ Be Respectful",
                value:
                    "Treat members and staff with respect."
            },
            {
                name: "2️⃣ No Spam",
                value:
                    "Do not spam messages, mentions, or channels."
            },
            {
                name: "3️⃣ No Abuse",
                value:
                    "Do not abuse Resolve, tickets, or server features."
            },
            {
                name: "4️⃣ Use the Correct Channels",
                value:
                    "Keep discussions and support requests in their appropriate channels."
            },
            {
                name: "5️⃣ Follow Discord's Rules",
                value:
                    "You must follow Discord's Terms of Service and Community Guidelines."
            }
        )
        .setFooter({
            text:
                "Resolve • Community Rules"
        })
        .setTimestamp();

    await channel.send({
        embeds: [embed]
    });
}

/*
 * Setup About Resolve.
 */
async function setupAbout(channel) {
    const embed = new EmbedBuilder()
        .setTitle("🤖 About Resolve")
        .setDescription(
            "Resolve is an AI-powered support bot for Discord communities."
        )
        .addFields(
            {
                name: "🧠 AI Support",
                value:
                    "Resolve uses approved server knowledge to help answer support questions."
            },
            {
                name: "🎫 Support Tickets",
                value:
                    "Members can open tickets and receive AI assistance."
            },
            {
                name: "👤 Human Support",
                value:
                    "When Resolve cannot confidently answer a question, it can hand the ticket to the Support Team."
            },
            {
                name: "📚 Knowledge",
                value:
                    "Important server information can be automatically learned from approved information channels."
            }
        )
        .setFooter({
            text:
                "Resolve • AI-powered support for Discord"
        })
        .setTimestamp();

    await channel.send({
        embeds: [embed]
    });
}

/*
 * Setup support channel.
 */
async function setupSupport(channel) {
    const embed = new EmbedBuilder()
        .setTitle("🎫 Resolve Support")
        .setDescription(
            "Need help with Resolve?\n\n" +
            "Open a support ticket and Resolve will try to help using the server's approved knowledge."
        )
        .addFields({
            name: "👤 Human Support",
            value:
                "If Resolve cannot confidently answer your question, your ticket can be handed to the Support Team."
        })
        .setFooter({
            text:
                "Resolve • Support"
        })
        .setTimestamp();

    await channel.send({
        embeds: [embed]
    });
}

/*
 * Setup FAQ.
 */
async function setupFAQ(channel) {
    const embed = new EmbedBuilder()
        .setTitle("❓ Frequently Asked Questions")
        .setDescription(
            "Frequently asked questions about Resolve will be maintained here."
        )
        .addFields(
            {
                name: "What is Resolve?",
                value:
                    "Resolve is an AI-powered support bot for Discord."
            },
            {
                name: "How does the AI work?",
                value:
                    "Resolve uses approved server information to answer support questions."
            },
            {
                name: "What happens if Resolve doesn't know?",
                value:
                    "Resolve can request human assistance instead of guessing."
            }
        )
        .setFooter({
            text:
                "Resolve • FAQ"
        })
        .setTimestamp();

    await channel.send({
        embeds: [embed]
    });
}

/*
 * Setup achievements.
 */
async function setupAchievements(channel) {
    const embed = new EmbedBuilder()
        .setTitle("🏆 Resolve Achievements")
        .setDescription(
            "Take part in the Resolve community and unlock achievements!"
        )
        .addFields(
            {
                name: "👋 Community",
                value:
                    "Join the community and participate in conversations."
            },
            {
                name: "🎫 Support",
                value:
                    "Use the support system and help improve Resolve."
            },
            {
                name: "🧠 Knowledge",
                value:
                    "Use Resolve and discover its support features."
            },
            {
                name: "💎 Milestones",
                value:
                    "Unlock special achievements by reaching community milestones."
            }
        )
        .setFooter({
            text:
                "Resolve • Achievements"
        })
        .setTimestamp();

    await channel.send({
        embeds: [embed]
    });
}

/*
 * Main command.
 */
module.exports = {
    data: new SlashCommandBuilder()
        .setName("server-setup")
        .setDescription(
            "Set up the official Resolve Support Server"
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    async execute(interaction) {
        try {
            /*
             * Only allow this command in the official
             * Resolve Support Server.
             */
            if (
                interaction.guildId !==
                SUPPORT_SERVER_ID
            ) {
                return interaction.reply({
                    content:
                        "❌ This command can only be used in the official Resolve Support Server.",
                    ephemeral: true
                });
            }

            /*
             * Owner or administrator only.
             */
            if (!canManageServer(interaction)) {
                return interaction.reply({
                    content:
                        "❌ You need Administrator permissions to use this command.",
                    ephemeral: true
                });
            }

            await interaction.deferReply({
                ephemeral: true
            });

            const guild =
                interaction.guild;

            /*
             * Database.
             */
            await setupDatabase(guild);

            /*
             * Roles.
             */
            console.log(
                "🎭 Creating Resolve roles..."
            );

            const createdRoles =
                await createRoles(guild);

            /*
             * Categories + channels.
             */
            console.log(
                "🏗️ Creating Resolve server structure..."
            );

            const createdChannels = [];

            for (
                const [
                    categoryName,
                    channelNames
                ] of Object.entries(
                    SERVER_STRUCTURE
                )
            ) {
                let category =
                    findCategory(
                        guild,
                        categoryName
                    );

                if (!category) {
                    category =
                        await guild.channels.create(
                            {
                                name:
                                    categoryName,
                                type:
                                    ChannelType.GuildCategory,
                                reason:
                                    "Resolve Support Server Setup"
                            }
                        );
                }

                for (
                    const channelName of channelNames
                ) {
                    const existing =
                        findChannel(
                            guild,
                            channelName
                        );

                    const channel =
                        await getOrCreateChannel(
                            guild,
                            channelName,
                            category
                        );

                    if (!existing) {
                        createdChannels.push(
                            channelName
                        );
                    }

                    /*
                     * Add starter content only when
                     * the channel is completely empty.
                     */
                    try {
                        const messages =
                            await channel.messages.fetch(
                                {
                                    limit: 5
                                }
                            );

                        if (
                            messages.size === 0
                        ) {
                            if (
                                channelName ===
                                "👋・welcome"
                            ) {
                                await setupWelcome(
                                    channel
                                );
                            }

                            if (
                                channelName ===
                                "📜・rules"
                            ) {
                                await setupRules(
                                    channel
                                );
                            }

                            if (
                                channelName ===
                                "🤖・about-resolve"
                            ) {
                                await setupAbout(
                                    channel
                                );
                            }

                            if (
                                channelName ===
                                "🎫・support"
                            ) {
                                await setupSupport(
                                    channel
                                );
                            }

                            if (
                                channelName ===
                                "❓・faq"
                            ) {
                                await setupFAQ(
                                    channel
                                );
                            }

                            if (
                                channelName ===
                                "🏆・achievements"
                            ) {
                                await setupAchievements(
                                    channel
                                );
                            }
                        }
                    } catch (error) {
                        console.error(
                            `⚠️ Could not initialize #${channelName}:`,
                            error
                        );
                    }
                }
            }

            /*
             * Find Support Team role.
             */
            const supportRole =
                guild.roles.cache.find(
                    role =>
                        role.name ===
                        "🔧 Support Team"
                );

            if (supportRole) {
                await db.query(
                    `
                    UPDATE guild_settings
                    SET support_role_id = $1,
                        updated_at = NOW()
                    WHERE guild_id = $2
                    `,
                    [
                        supportRole.id,
                        guild.id
                    ]
                );
            }

            /*
             * Automatic knowledge sync.
             */
            const knowledgeResult =
                await syncAutomaticKnowledge(
                    guild
                );

            /*
             * Final response.
             */
            const completeEmbed =
                new EmbedBuilder()
                    .setTitle(
                        "✅ Resolve Server Setup Complete"
                    )
                    .setDescription(
                        "The official Resolve Support Server has been configured successfully."
                    )
                    .addFields(
                        {
                            name: "🎭 Roles",
                            value:
                                `${SERVER_ROLES.length} configured` +
                                (
                                    createdRoles.length
                                        ? `\n${createdRoles.length} created`
                                        : ""
                                ),
                            inline: true
                        },
                        {
                            name: "📁 Channels",
                            value:
                                `${Object.values(
                                    SERVER_STRUCTURE
                                ).flat().length} configured` +
                                (
                                    createdChannels.length
                                        ? `\n${createdChannels.length} created`
                                        : ""
                                ),
                            inline: true
                        },
                        {
                            name: "🧠 Knowledge",
                            value:
                                `${knowledgeResult.synced} channels synchronized\n${knowledgeResult.messagesLearned} messages learned`,
                            inline: true
                        }
                    )
                    .addFields({
                        name: "👀 Automatic Knowledge",
                        value:
                            AUTO_KNOWLEDGE_CHANNELS
                                .map(
                                    name =>
                                        `• ${name}`
                                )
                                .join("\n"),
                        inline: false
                    })
                    .setFooter({
                        text:
                            "Resolve • AI-powered support for Discord"
                    })
                    .setTimestamp();

            await interaction.editReply({
                embeds: [
                    completeEmbed
                ]
            });

            console.log(
                "================================="
            );
            console.log(
                "✅ Resolve server setup complete!"
            );
            console.log(
                `🧠 Knowledge channels synced: ${knowledgeResult.synced}`
            );
            console.log(
                `🧠 Messages learned: ${knowledgeResult.messagesLearned}`
            );
            console.log(
                "================================="
            );

        } catch (error) {
            console.error(
                "❌ Server setup failed:",
                error
            );

            try {
                if (
                    interaction.deferred ||
                    interaction.replied
                ) {
                    await interaction.editReply({
                        content:
                            "❌ **Server setup failed.**\n\n" +
                            `\`${error.message || "Unknown error"}\`\n\n` +
                            "Check the bot logs for the full error."
                    });
                } else {
                    await interaction.reply({
                        content:
                            "❌ **Server setup failed.**\n\n" +
                            `\`${error.message || "Unknown error"}\``,
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error(
                    "❌ Could not send setup error:",
                    replyError
                );
            }
        }
    }
};