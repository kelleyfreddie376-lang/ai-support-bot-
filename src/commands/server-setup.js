const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const db = require("../database/db");

const SUPPORT_SERVER_ID = "1545866787059671100";

/*
==================================================
CATEGORIES
==================================================
*/

const CATEGORIES = {
    START: "📌 START HERE",
    RESOLVE: "📢 RESOLVE",
    SUPPORT: "🆘 SUPPORT",
    ACHIEVEMENTS: "🏆 ACHIEVEMENTS",
    COMMUNITY: "💬 COMMUNITY",
    STAFF: "🔒 STAFF"
};

/*
==================================================
CHANNELS
==================================================
*/

const CHANNELS = {
    START: [
        ["👋・welcome", "Welcome to the official Resolve Support Server."],
        ["📜・rules", "Read the Resolve community rules."],
        ["🤖・about-resolve", "Learn about Resolve."],
        ["🎭・reaction-roles", "Choose your notification roles."],
        ["🎨・colors", "Choose your server color."]
    ],

    RESOLVE: [
        ["📢・announcements", "Official Resolve announcements."],
        ["🚀・updates", "Resolve updates and news."],
        ["📝・changelog", "Recent Resolve changes."]
    ],

    SUPPORT: [
        ["🎫・support", "Open a support ticket."],
        ["❓・faq", "Frequently asked questions."],
        ["🐛・bug-reports", "Report Resolve bugs."],
        ["💡・suggestions", "Suggest improvements."]
    ],

    ACHIEVEMENTS: [
        ["🏆・achievements", "View available achievements."],
        ["📜・achievement-log", "Recent achievement unlocks."]
    ],

    COMMUNITY: [
        ["💬・general", "General community discussion."],
        ["🎉・events", "Resolve community events."],
        ["🖼️・showcase", "Showcase your work."]
    ],

    STAFF: [
        ["💬・staff-chat", "Private staff discussion."],
        ["📋・staff-logs", "Staff and bot logs."],
        ["🛡️・staff-info", "Private staff information."],
        ["📊・support-stats", "Support statistics."]
    ]
};

/*
==================================================
NORMAL ROLES
==================================================
*/

const ROLES = [
    ["👑 Resolve Owner", 0xF1C40F],
    ["🛡️ Resolve Admin", 0xE74C3C],
    ["🔧 Support Manager", 0xE67E22],
    ["🎧 Senior Support", 0x3498DB],
    ["💬 Support Team", 0x2ECC71],
    ["🧪 Support Trial", 0x95A5A6],
    ["🐛 Bug Hunter", 0x9B59B6],
    ["💡 Community Team", 0x1ABC9C],
    ["🌟 Early Supporter", 0xF1C40F],
    ["🤖 Bot", 0x5865F2],

    ["🔴 Red", 0xE74C3C],
    ["🟠 Orange", 0xE67E22],
    ["🟡 Yellow", 0xF1C40F],
    ["🟢 Green", 0x2ECC71],
    ["🔵 Blue", 0x3498DB],
    ["🟣 Purple", 0x9B59B6],
    ["🩷 Pink", 0xE91E63],
    ["🩵 Cyan", 0x1ABC9C],
    ["⚪ White", 0xFFFFFF],
    ["⚫ Black", 0x2C2F33],

    ["📢 Announcements", 0x5865F2],
    ["🚀 Updates", 0x3498DB],
    ["🐛 Bug Updates", 0xE74C3C],
    ["🎉 Events", 0xF1C40F],
    ["💡 Suggestions", 0x2ECC71]
];

/*
==================================================
ACHIEVEMENT ROLES
==================================================
*/

const ACHIEVEMENT_ROLES = [
    ["👋 Resolve Member", 0x5865F2],
    ["🎫 First Ticket", 0x3498DB],
    ["🐛 Bug Hunter", 0xE74C3C],
    ["💡 Idea Maker", 0xF1C40F],
    ["🧠 Knowledge Seeker", 0x9B59B6],
    ["🤖 Resolve Explorer", 0x2ECC71],
    ["💬 Community Member", 0x1ABC9C],
    ["🏆 Support Veteran", 0xF39C12],
    ["⭐ Support Legend", 0xE67E22],
    ["💎 Achievement Master", 0x3498DB],
    ["👑 Resolve OG", 0xF1C40F]
];

/*
==================================================
LEGACY CLEANUP
==================================================
*/

const LEGACY_CATEGORIES = [
    "📢 INFORMATION",
    "🌐 COMMUNITY",
    "🎫 TICKETS"
];

const LEGACY_CHANNELS = [
    "welcome",
    "announcements",
    "rules",
    "about-resolve",
    "support",
    "bug-reports",
    "suggestions",
    "faq",
    "colors",
    "reaction-roles",
    "general",
    "events",
    "staff-chat",
    "staff-logs",
    "staff-info",
    "support-stats"
];

/*
==================================================
COMMAND
==================================================
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

        if (
            !interaction.member.permissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {
            return interaction.reply({
                content:
                    "❌ You need Administrator to use this command.",
                ephemeral: true
            });
        }

        await interaction.deferReply({
            ephemeral: true
        });

        const guild = interaction.guild;

        try {

            console.log(
                "================================="
            );

            console.log(
                "⚙️ Starting Resolve Support Server setup..."
            );

            /*
            ==========================================
            CREATE NORMAL ROLES
            ==========================================
            */

            const roles = {};

            for (
                const [name, color]
                of ROLES
            ) {

                let role =
                    guild.roles.cache.find(
                        r => r.name === name
                    );

                if (!role) {

                    role =
                        await guild.roles.create({
                            name,
                            color,
                            reason:
                                "Resolve Support Server setup"
                        });

                    console.log(
                        `➕ Created role: ${name}`
                    );
                }

                roles[name] = role;
            }

            /*
            ==========================================
            CREATE ACHIEVEMENT ROLES
            ==========================================
            */

            const achievementRoles = {};

            for (
                const [name, color]
                of ACHIEVEMENT_ROLES
            ) {

                let role =
                    guild.roles.cache.find(
                        r => r.name === name
                    );

                if (!role) {

                    role =
                        await guild.roles.create({
                            name,
                            color,
                            reason:
                                "Resolve achievement role setup"
                        });

                    console.log(
                        `🏆 Created achievement role: ${name}`
                    );
                }

                achievementRoles[name] =
                    role;
            }

            /*
            ==========================================
            OWNER ROLE
            ==========================================
            */

            const ownerRole =
                roles["👑 Resolve Owner"];

            if (
                ownerRole &&
                !interaction.member.roles.cache.has(
                    ownerRole.id
                )
            ) {

                await interaction.member.roles.add(
                    ownerRole,
                    "Resolve Support Server setup"
                );
            }

            /*
            ==========================================
            CLEAN OLD CATEGORIES
            ==========================================
            */

            for (
                const categoryName
                of LEGACY_CATEGORIES
            ) {

                const category =
                    guild.channels.cache.find(
                        channel =>
                            channel.type ===
                                ChannelType.GuildCategory &&
                            channel.name ===
                                categoryName
                    );

                if (!category) continue;

                if (
                    category.id ===
                    interaction.channel?.parentId
                ) {

                    console.log(
                        `🛡️ Keeping active category: ${category.name}`
                    );

                    continue;
                }

                const children =
                    guild.channels.cache.filter(
                        channel =>
                            channel.parentId ===
                            category.id
                    );

                for (
                    const child
                    of children.values()
                ) {

                    if (
                        child.id ===
                        interaction.channelId
                    ) {

                        console.log(
                            `🛡️ Keeping setup channel: ${child.name}`
                        );

                        continue;
                    }

                    try {

                        await child.delete(
                            "Remove old Resolve layout"
                        );

                        console.log(
                            `🗑️ Deleted old channel: ${child.name}`
                        );

                    } catch (error) {

                        console.error(
                            `⚠️ Could not delete ${child.name}:`,
                            error.message
                        );
                    }
                }

                try {

                    await category.delete(
                        "Remove old Resolve layout"
                    );

                } catch (error) {

                    console.error(
                        `⚠️ Could not delete category ${category.name}:`,
                        error.message
                    );
                }
            }

            /*
            ==========================================
            DELETE OLD CHANNEL NAMES
            ==========================================
            */

            for (
                const oldName
                of LEGACY_CHANNELS
            ) {

                const oldChannels =
                    guild.channels.cache.filter(
                        channel =>
                            channel.type ===
                                ChannelType.GuildText &&
                            channel.name ===
                                oldName
                    );

                for (
                    const channel
                    of oldChannels.values()
                ) {

                    if (
                        channel.id ===
                        interaction.channelId
                    ) {

                        console.log(
                            `🛡️ Keeping active setup channel: ${channel.name}`
                        );

                        continue;
                    }

                    try {

                        await channel.delete(
                            "Remove old Resolve layout"
                        );

                        console.log(
                            `🗑️ Deleted old channel: ${channel.name}`
                        );

                    } catch (error) {

                        console.error(
                            `⚠️ Could not delete ${channel.name}:`,
                            error.message
                        );
                    }
                }
            }

            /*
            ==========================================
            CREATE CATEGORIES
            ==========================================
            */

            const categories = {};

            for (
                const [key, name]
                of Object.entries(CATEGORIES)
            ) {

                let category =
                    guild.channels.cache.find(
                        channel =>
                            channel.type ===
                                ChannelType.GuildCategory &&
                            channel.name === name
                    );

                if (!category) {

                    category =
                        await guild.channels.create({
                            name,
                            type:
                                ChannelType.GuildCategory,
                            reason:
                                "Resolve Support Server organization"
                        });

                    console.log(
                        `📁 Created category: ${name}`
                    );
                }

                categories[key] =
                    category;
            }

            /*
            ==========================================
            STAFF PERMISSIONS
            ==========================================
            */

            await setStaffPermissions(
                categories.STAFF,
                guild,
                roles
            );

            /*
            ==========================================
            CREATE CHANNELS
            ==========================================
            */

            const channels = {};

            async function createChannel(
                categoryKey,
                name,
                topic,
                privateChannel = false
            ) {

                const category =
                    categories[categoryKey];

                let channel =
                    guild.channels.cache.find(
                        c =>
                            c.type ===
                                ChannelType.GuildText &&
                            c.name === name
                    );

                if (!channel) {

                    channel =
                        await guild.channels.create({
                            name,
                            type:
                                ChannelType.GuildText,
                            parent:
                                category.id,
                            topic,
                            reason:
                                "Resolve Support Server organization"
                        });

                    console.log(
                        `📝 Created ${name}`
                    );

                } else {

                    if (
                        channel.parentId !==
                        category.id
                    ) {

                        await channel.setParent(
                            category.id,
                            {
                                lockPermissions: false,
                                reason:
                                    "Resolve channel organization"
                            }
                        );
                    }

                    await channel
                        .setTopic(topic)
                        .catch(() => {});
                }

                if (privateChannel) {

                    await channel.permissionOverwrites.set([
                        {
                            id:
                                guild.roles.everyone.id,
                            deny: [
                                PermissionFlagsBits.ViewChannel
                            ]
                        },
                        ...Object.values(
                            roles
                        )
                            .filter(role =>
                                [
                                    "👑 Resolve Owner",
                                    "🛡️ Resolve Admin",
                                    "🔧 Support Manager",
                                    "🎧 Senior Support",
                                    "💬 Support Team"
                                ].includes(
                                    role.name
                                )
                            )
                            .map(role => ({
                                id: role.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel
                                ]
                            }))
                    ]);
                }

                channels[name] =
                    channel;

                return channel;
            }

            /*
            ==========================================
            MAKE CHANNELS
            ==========================================
            */

            for (
                const [name, topic]
                of CHANNELS.START
            ) {
                await createChannel(
                    "START",
                    name,
                    topic
                );
            }

            for (
                const [name, topic]
                of CHANNELS.RESOLVE
            ) {
                await createChannel(
                    "RESOLVE",
                    name,
                    topic
                );
            }

            for (
                const [name, topic]
                of CHANNELS.SUPPORT
            ) {
                await createChannel(
                    "SUPPORT",
                    name,
                    topic
                );
            }

            for (
                const [name, topic]
                of CHANNELS.ACHIEVEMENTS
            ) {
                await createChannel(
                    "ACHIEVEMENTS",
                    name,
                    topic
                );
            }

            for (
                const [name, topic]
                of CHANNELS.COMMUNITY
            ) {
                await createChannel(
                    "COMMUNITY",
                    name,
                    topic
                );
            }

            for (
                const [name, topic]
                of CHANNELS.STAFF
            ) {
                await createChannel(
                    "STAFF",
                    name,
                    topic,
                    true
                );
            }

            /*
            ==========================================
            WELCOME
            ==========================================
            */

            await sendOrUpdate(
                channels["👋・welcome"],
                "👋 Welcome to Resolve",
                new EmbedBuilder()
                    .setTitle("👋 Welcome to Resolve")
                    .setDescription(
                        "**Welcome to the official Resolve Support Server.**\n\n" +
                        "Resolve is an **AI-powered support bot for Discord**, designed to help communities provide faster, smarter, and more reliable support.\n\n" +
                        "Whether you're here to get help, report a problem, share an idea, or meet the community — you've found the right place."
                    )
                    .addFields(
                        {
                            name: "🤖 What is Resolve?",
                            value:
                                "An AI-powered support system built specifically for Discord communities."
                        },
                        {
                            name: "🎫 Need Help?",
                            value:
                                "Head to **🎫・support** and open a ticket."
                        },
                        {
                            name: "🐛 Found a Bug?",
                            value:
                                "Report it in **🐛・bug-reports**."
                        },
                        {
                            name: "💡 Have an Idea?",
                            value:
                                "Share it in **💡・suggestions**."
                        },
                        {
                            name: "🏆 Want Achievements?",
                            value:
                                "Participate in the community and unlock achievements. Every achievement can earn you a special role."
                        },
                        {
                            name: "🎭 Customize Your Roles",
                            value:
                                "Choose notification roles in **🎭・reaction-roles** and colors in **🎨・colors**."
                        }
                    )
                    .setFooter({
                        text:
                            "Resolve • AI-powered support for Discord"
                    })
                    .setTimestamp()
            );

            /*
            ==========================================
            RULES
            ==========================================
            */

            await sendOrUpdate(
                channels["📜・rules"],
                "📜 Resolve Community Rules",
                new EmbedBuilder()
                    .setTitle(
                        "📜 Resolve Community Rules"
                    )
                    .setDescription(
                        "A great community starts with everyone doing their part."
                    )
                    .addFields(
                        {
                            name: "01 • 🤝 Respect",
                            value:
                                "Treat everyone with respect. Harassment and targeted abuse are not welcome."
                        },
                        {
                            name: "02 • 💬 Keep It Appropriate",
                            value:
                                "Keep conversations appropriate and follow Discord's rules."
                        },
                        {
                            name: "03 • 🚫 No Spam",
                            value:
                                "Don't spam messages, mentions, reactions, or commands."
                        },
                        {
                            name: "04 • 📢 No Unapproved Advertising",
                            value:
                                "Don't advertise unrelated communities or services without permission."
                        },
                        {
                            name: "05 • 🎫 Use Support Properly",
                            value:
                                "Use the appropriate channels and provide useful information when requesting support."
                        },
                        {
                            name: "06 • 🛡️ Respect Staff",
                            value:
                                "Follow reasonable directions from the Resolve Support Team."
                        },
                        {
                            name: "07 • 📜 Discord Guidelines",
                            value:
                                "You must follow Discord's Terms of Service and Community Guidelines."
                        }
                    )
                    .setFooter({
                        text:
                            "Resolve • Community Guidelines"
                    })
                    .setTimestamp()
            );

            /*
            ==========================================
            ABOUT
            ==========================================
            */

            await sendOrUpdate(
                channels["🤖・about-resolve"],
                "🤖 Meet Resolve",
                new EmbedBuilder()
                    .setTitle("🤖 Meet Resolve")
                    .setDescription(
                        "**AI-powered support for Discord.**\n\n" +
                        "Resolve combines AI assistance with human support to help Discord communities handle questions and support requests."
                    )
                    .addFields(
                        {
                            name: "🧠 AI Support",
                            value:
                                "Answer questions using verified server knowledge."
                        },
                        {
                            name: "🔐 Verified Knowledge",
                            value:
                                "Staff control the information Resolve can use."
                        },
                        {
                            name: "🎫 Smart Tickets",
                            value:
                                "Organized support tickets with priority levels."
                        },
                        {
                            name: "👤 Human Handoff",
                            value:
                                "When AI can't confidently help, human support takes over."
                        },
                        {
                            name: "🏆 Achievements",
                            value:
                                "Earn special achievements and unlock exclusive roles."
                        },
                        {
                            name: "🌐 Built for Discord",
                            value:
                                "Designed around real Discord communities."
                        }
                    )
                    .setFooter({
                        text:
                            "Resolve • Built for Discord"
                    })
                    .setTimestamp()
            );

            /*
            ==========================================
            SUPPORT
            ==========================================
            */

            await sendOrUpdate(
                channels["🎫・support"],
                "🎫 Resolve Support Center",
                new EmbedBuilder()
                    .setTitle(
                        "🎫 Resolve Support Center"
                    )
                    .setDescription(
                        "**Need help? Open a support ticket below.**\n\n" +
                        "Choose the priority that best matches your issue. Please don't select Urgent unless your issue genuinely requires immediate attention."
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
                                "Regular support issues.",
                            inline: true
                        },
                        {
                            name: "🟠 High",
                            value:
                                "Important issues that should be reviewed sooner.",
                            inline: true
                        },
                        {
                            name: "🔴 Urgent",
                            value:
                                "Critical issues requiring immediate attention.",
                            inline: true
                        }
                    )
                    .setFooter({
                        text:
                            "Resolve Support • Choose your priority"
                    })
                    .setTimestamp(),
                [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(
                                    "ticket_priority_low"
                                )
                                .setLabel("Low")
                                .setEmoji("🟢")
                                .setStyle(
                                    ButtonStyle.Success
                                ),

                            new ButtonBuilder()
                                .setCustomId(
                                    "ticket_priority_normal"
                                )
                                .setLabel("Normal")
                                .setEmoji("🔵")
                                .setStyle(
                                    ButtonStyle.Primary
                                ),

                            new ButtonBuilder()
                                .setCustomId(
                                    "ticket_priority_high"
                                )
                                .setLabel("High")
                                .setEmoji("🟠")
                                .setStyle(
                                    ButtonStyle.Secondary
                                ),

                            new ButtonBuilder()
                                .setCustomId(
                                    "ticket_priority_urgent"
                                )
                                .setLabel("Urgent")
                                .setEmoji("🔴")
                                .setStyle(
                                    ButtonStyle.Danger
                                )
                        )
                ]
            );

            /*
            ==========================================
            ACHIEVEMENTS
            ==========================================
            */

            await sendOrUpdate(
                channels["🏆・achievements"],
                "🏆 Resolve Achievements",
                new EmbedBuilder()
                    .setTitle(
                        "🏆 Resolve Achievement Hall"
                    )
                    .setDescription(
                        "**Earn achievements. Unlock roles. Become part of Resolve.**\n\n" +
                        "Achievements are automatically awarded when you complete their requirements.\n\n" +
                        "When you unlock one, Resolve will **DM you** and announce your achievement in **📜・achievement-log**."
                    )
                    .addFields(
                        {
                            name: "🌟 Getting Started",
                            value:
                                "👋 Resolve Member\n" +
                                "🤖 Resolve Explorer\n" +
                                "🎨 Colorful",
                            inline: true
                        },
                        {
                            name: "🎫 Support",
                            value:
                                "🎫 First Ticket\n" +
                                "🏆 Support Veteran\n" +
                                "⭐ Support Legend",
                            inline: true
                        },
                        {
                            name: "🐛 Bug Hunting",
                            value:
                                "🐛 Bug Hunter",
                            inline: true
                        },
                        {
                            name: "💡 Ideas",
                            value:
                                "💡 Idea Maker",
                            inline: true
                        },
                        {
                            name: "🧠 Knowledge",
                            value:
                                "🧠 Knowledge Seeker",
                            inline: true
                        },
                        {
                            name: "💬 Community",
                            value:
                                "💬 Community Member",
                            inline: true
                        },
                        {
                            name: "💎 Rare",
                            value:
                                "💎 Achievement Master\n" +
                                "👑 Resolve OG",
                            inline: true
                        }
                    )
                    .setFooter({
                        text:
                            "Resolve • How many can you unlock?"
                    })
                    .setTimestamp()
            );

            /*
            ==========================================
            FAQ
            ==========================================
            */

            await sendOrUpdate(
                channels["❓・faq"],
                "❓ Frequently Asked Questions",
                new EmbedBuilder()
                    .setTitle(
                        "❓ Frequently Asked Questions"
                    )
                    .setDescription(
                        "Quick answers to common questions."
                    )
                    .addFields(
                        {
                            name: "🤖 What is Resolve?",
                            value:
                                "Resolve is an AI-powered support bot for Discord."
                        },
                        {
                            name: "🎫 How do I get support?",
                            value:
                                "Open a ticket in **🎫・support**."
                        },
                        {
                            name: "🐛 Where do I report bugs?",
                            value:
                                "Use **🐛・bug-reports**."
                        },
                        {
                            name: "💡 Where do I suggest features?",
                            value:
                                "Use **💡・suggestions**."
                        },
                        {
                            name: "🏆 How do achievements work?",
                            value:
                                "Complete their requirements and Resolve automatically awards the achievement and its role."
                        }
                    )
                    .setFooter({
                        text:
                            "Resolve • FAQ"
                    })
                    .setTimestamp()
            );

            /*
            ==========================================
            REACTION ROLES
            ==========================================
            */

            await sendOrUpdate(
                channels["🎭・reaction-roles"],
                "🎭 Notification Roles",
                new EmbedBuilder()
                    .setTitle(
                        "🎭 Choose Your Notification Roles"
                    )
                    .setDescription(
                        "React to receive the notifications you care about.\n\n" +
                        "Remove your reaction whenever you want to remove the role."
                    )
                    .addFields(
                        {
                            name: "📢 Announcements",
                            value:
                                "Major Resolve announcements.",
                            inline: true
                        },
                        {
                            name: "🚀 Updates",
                            value:
                                "Product updates.",
                            inline: true
                        },
                        {
                            name: "🐛 Bug Updates",
                            value:
                                "Bug-related announcements.",
                            inline: true
                        },
                        {
                            name: "🎉 Events",
                            value:
                                "Community events.",
                            inline: true
                        },
                        {
                            name: "💡 Suggestions",
                            value:
                                "Suggestion updates.",
                            inline: true
                        }
                    )
                    .setFooter({
                        text:
                            "Resolve • Notification Roles"
                    })
                    .setTimestamp()
            );

            /*
            ==========================================
            COLORS
            ==========================================
            */

            await sendOrUpdate(
                channels["🎨・colors"],
                "🎨 Choose Your Color",
                new EmbedBuilder()
                    .setTitle(
                        "🎨 Choose Your Color"
                    )
                    .setDescription(
                        "React below to choose your name color.\n\n" +
                        "**You can only have one color role at a time.**"
                    )
                    .addFields(
                        {
                            name: "🔴 Red",
                            value: "🔴",
                            inline: true
                        },
                        {
                            name: "🟠 Orange",
                            value: "🟠",
                            inline: true
                        },
                        {
                            name: "🟡 Yellow",
                            value: "🟡",
                            inline: true
                        },
                        {
                            name: "🟢 Green",
                            value: "🟢",
                            inline: true
                        },
                        {
                            name: "🔵 Blue",
                            value: "🔵",
                            inline: true
                        },
                        {
                            name: "🟣 Purple",
                            value: "🟣",
                            inline: true
                        },
                        {
                            name: "🩷 Pink",
                            value: "🩷",
                            inline: true
                        },
                        {
                            name: "🩵 Cyan",
                            value: "🩵",
                            inline: true
                        },
                        {
                            name: "⚪ White",
                            value: "⚪",
                            inline: true
                        },
                        {
                            name: "⚫ Black",
                            value: "⚫",
                            inline: true
                        }
                    )
                    .setFooter({
                        text:
                            "Resolve • Color Roles"
                    })
                    .setTimestamp()
            );

            /*
            ==========================================
            ADD REACTIONS
            ==========================================
            */

            await addReactionPanelReactions(
                channels["🎭・reaction-roles"],
                [
                    "📢",
                    "🚀",
                    "🐛",
                    "🎉",
                    "💡"
                ]
            );

            await addReactionPanelReactions(
                channels["🎨・colors"],
                [
                    "🔴",
                    "🟠",
                    "🟡",
                    "🟢",
                    "🔵",
                    "🟣",
                    "🩷",
                    "🩵",
                    "⚪",
                    "⚫"
                ]
            );

            /*
            ==========================================
            DATABASE
            ==========================================
            */

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
                    support_role_id,
                    ticket_category_id,
                    ai_enabled
                )
                VALUES ($1, $2, $3, TRUE)
                ON CONFLICT (guild_id)
                DO UPDATE SET
                    support_role_id =
                        EXCLUDED.support_role_id,
                    ticket_category_id =
                        EXCLUDED.ticket_category_id,
                    ai_enabled = TRUE,
                    updated_at = NOW()
                `,
                [
                    guild.id,
                    roles["💬 Support Team"].id,
                    categories.SUPPORT.id
                ]
            );

            /*
            ==========================================
            FINAL
            ==========================================
            */

            const finalEmbed =
                new EmbedBuilder()
                    .setTitle(
                        "✨ Resolve Support Server Ready"
                    )
                    .setDescription(
                        "**Setup has been completed successfully.**\n\n" +
                        "The official Resolve Support Server has been organized and branded."
                    )
                    .addFields(
                        {
                            name: "📌 Start Here",
                            value:
                                "Welcome, rules, roles & colors",
                            inline: true
                        },
                        {
                            name: "📢 Resolve",
                            value:
                                "Announcements, updates & changelog",
                            inline: true
                        },
                        {
                            name: "🆘 Support",
                            value:
                                "Tickets, FAQ, bugs & suggestions",
                            inline: true
                        },
                        {
                            name: "🏆 Achievements",
                            value:
                                "Achievement Hall & unlock logs",
                            inline: true
                        },
                        {
                            name: "💬 Community",
                            value:
                                "Chat, events & showcase",
                            inline: true
                        },
                        {
                            name: "🔒 Staff",
                            value:
                                "Private staff area",
                            inline: true
                        }
                    )
                    .setFooter({
                        text:
                            "Resolve • AI-powered support for Discord"
                    })
                    .setTimestamp();

            try {

                await interaction.editReply({
                    embeds: [finalEmbed]
                });

            } catch (error) {

                console.error(
                    "⚠️ Could not edit setup response:",
                    error.message
                );
            }

            console.log(
                "✅ Resolve Support Server setup completed!"
            );

            console.log(
                "================================="
            );

        } catch (error) {

            console.error(
                "❌ Server setup error:",
                error
            );

            try {

                await interaction.editReply({
                    content:
                        "❌ Server setup failed. Check the bot console for the error."
                });

            } catch (replyError) {

                console.error(
                    "⚠️ Could not send setup error:",
                    replyError.message
                );
            }
        }
    }
};

/*
==================================================
STAFF PERMISSIONS
==================================================
*/

async function setStaffPermissions(
    category,
    guild,
    roles
) {

    await category.permissionOverwrites.set([
        {
            id:
                guild.roles.everyone.id,
            deny: [
                PermissionFlagsBits.ViewChannel
            ]
        },
        ...[
            "👑 Resolve Owner",
            "🛡️ Resolve Admin",
            "🔧 Support Manager",
            "🎧 Senior Support",
            "💬 Support Team"
        ]
            .map(name => roles[name])
            .filter(Boolean)
            .map(role => ({
                id: role.id,
                allow: [
                    PermissionFlagsBits.ViewChannel
                ]
            }))
    ]);
}

/*
==================================================
SEND / UPDATE EMBED
==================================================
*/

async function sendOrUpdate(
    channel,
    title,
    embed,
    components = []
) {

    if (!channel) return;

    try {

        const messages =
            await channel.messages.fetch({
                limit: 25
            });

        const existing =
            messages.find(
                message =>
                    message.author.id ===
                        channel.client.user.id &&
                    message.embeds.length > 0 &&
                    message.embeds[0].title ===
                        title
            );

        if (existing) {

            await existing.edit({
                embeds: [embed],
                components
            });

            return existing;
        }

        return await channel.send({
            embeds: [embed],
            components
        });

    } catch (error) {

        console.error(
            `⚠️ Could not update ${channel.name}:`,
            error.message
        );
    }
}

/*
==================================================
REACTIONS
==================================================
*/

async function addReactionPanelReactions(
    channel,
    emojis
) {

    if (!channel) return;

    try {

        const messages =
            await channel.messages.fetch({
                limit: 25
            });

        const panel =
            messages.find(
                message =>
                    message.author.id ===
                        channel.client.user.id &&
                    message.embeds.length > 0
            );

        if (!panel) return;

        for (
            const emoji
            of emojis
        ) {

            try {

                if (
                    !panel.reactions.cache.has(
                        emoji
                    )
                ) {

                    await panel.react(
                        emoji
                    );
                }

            } catch (error) {

                console.error(
                    `⚠️ Could not add reaction ${emoji}:`,
                    error.message
                );
            }
        }

    } catch (error) {

        console.error(
            `⚠️ Could not load reactions for ${channel.name}:`,
            error.message
        );
    }
}