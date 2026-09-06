const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/db");

const SUPPORT_SERVER_ID = "1545866787059671100";

/*
 * Channels Resolve automatically watches.
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
 * Complete Resolve server structure.
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
 * Resolve roles.
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
 * Check permissions.
 */
function canManageServer(interaction) {
    const ownerId = process.env.BOT_OWNER_ID;

    if (
        ownerId &&
        interaction.user.id === ownerId
    ) {
        return true;
    }

    return interaction.memberPermissions?.has(
        PermissionFlagsBits.Administrator
    );
}

/*
 * Find category.
 */
function findCategory(guild, name) {
    return guild.channels.cache.find(
        channel =>
            channel.type === ChannelType.GuildCategory &&
            channel.name === name
    );
}

/*
 * Find text channel.
 */
function findChannel(guild, name) {
    return guild.channels.cache.find(
        channel =>
            channel.type === ChannelType.GuildText &&
            channel.name === name
    );
}

/*
 * Get or create a text channel.
 */
async function getOrCreateChannel(
    guild,
    name,
    category
) {
    let channel = findChannel(
        guild,
        name
    );

    if (channel) {
        if (
            category &&
            channel.parentId !== category.id
        ) {
            await channel
                .setParent(category.id)
                .catch(() => {});
        }

        return {
            channel,
            created: false
        };
    }

    channel =
        await guild.channels.create({
            name,
            type: ChannelType.GuildText,
            parent: category?.id || null,
            reason:
                "Resolve Support Server Setup"
        });

    return {
        channel,
        created: true
    };
}

/*
 * Create roles.
 */
async function createRoles(guild) {
    let created = 0;

    for (const roleData of SERVER_ROLES) {
        const existing =
            guild.roles.cache.find(
                role =>
                    role.name ===
                    roleData.name
            );

        if (existing) {
            continue;
        }

        try {
            await guild.roles.create({
                name: roleData.name,
                color: roleData.color,
                reason:
                    "Resolve Support Server Setup"
            });

            created++;
        } catch (error) {
            console.error(
                `❌ Could not create role ${roleData.name}:`,
                error
            );
        }
    }

    return created;
}

/*
 * Setup database.
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
 * Save something directly to Resolve's knowledge.
 *
 * This is important because these messages are sent by the bot,
 * and the normal message watcher intentionally ignores bot messages.
 */
async function saveKnowledge(
    guild,
    channel,
    title,
    content
) {
    try {
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
                title,
                content,
                guild.members.me?.id ||
                    guild.client.user.id,
                channel.id
            ]
        );

        return true;
    } catch (error) {
        console.error(
            `❌ Could not save knowledge from #${channel.name}:`,
            error
        );

        return false;
    }
}

/*
 * Send an embed only if the channel does not already contain
 * a Resolve setup message.
 */
async function sendSetupEmbed(
    guild,
    channel,
    key,
    embed,
    knowledgeTitle,
    knowledgeContent
) {
    try {
        const recent =
            await channel.messages.fetch({
                limit: 50
            });

        const alreadyExists =
            recent.some(
                message =>
                    message.author.id ===
                        guild.client.user.id &&
                    message.embeds.some(
                        existing =>
                            existing.data?.footer?.text ===
                            "Resolve • Official Server Setup" &&
                            existing.data?.title ===
                            embed.data?.title
                    )
            );

        if (alreadyExists) {
            return false;
        }

        await channel.send({
            embeds: [embed]
        });

        await saveKnowledge(
            guild,
            channel,
            knowledgeTitle,
            knowledgeContent
        );

        console.log(
            `🧠 Added setup knowledge: #${channel.name}`
        );

        return true;
    } catch (error) {
        console.error(
            `❌ Could not send setup content to #${channel.name}:`,
            error
        );

        return false;
    }
}

/*
 * Common footer.
 */
function setupFooter() {
    return {
        text:
            "Resolve • Official Server Setup"
    };
}

/*
 * WELCOME
 */
async function setupWelcome(
    guild,
    channel
) {
    const embed =
        new EmbedBuilder()
            .setTitle(
                "👋 Welcome to Resolve!"
            )
            .setDescription(
                "Welcome to the official Resolve Support Server!\n\n" +
                "Resolve is an AI-powered support platform built to help Discord communities provide faster, smarter support."
            )
            .addFields(
                {
                    name: "🤖 What is Resolve?",
                    value:
                        "Resolve helps Discord servers manage support tickets, answer questions using approved knowledge, and connect users with human Support Teams when needed."
                },
                {
                    name: "🎫 Need Support?",
                    value:
                        "Visit 🎫・support to get help with Resolve."
                },
                {
                    name: "📚 Learn More",
                    value:
                        "Check 📜・rules, 🤖・about-resolve, ❓・faq, 📢・announcements, and 🚀・updates."
                },
                {
                    name: "🏆 Achievements",
                    value:
                        "Participate in the community, use Resolve, open tickets, and unlock achievements."
                }
            )
            .setFooter(setupFooter())
            .setTimestamp();

    return sendSetupEmbed(
        guild,
        channel,
        "welcome",
        embed,
        "Official Knowledge • Welcome",
        "Welcome to the official Resolve Support Server. Resolve is an AI-powered support platform built to help Discord communities provide faster, smarter support. Members can learn about Resolve, get support, read FAQs, view updates, and participate in the community."
    );
}

/*
 * RULES
 */
async function setupRules(
    guild,
    channel
) {
    const content = `
RESOLVE COMMUNITY RULES

Welcome to the official Resolve Support Server.

1. BE RESPECTFUL
Treat members, Support Team members, moderators, developers, and staff with respect.

2. NO SPAM
Do not spam messages, mentions, reactions, commands, or channels.

3. USE THE CORRECT CHANNELS
Keep questions, bugs, suggestions, events, general conversation, and support requests in their appropriate channels.

4. SUPPORT TICKETS
Explain your issue clearly, provide useful information, do not create duplicate tickets, and be patient while waiting for support.

5. DO NOT ABUSE RESOLVE
Do not intentionally manipulate, exploit, spam, or abuse Resolve or its AI features.

6. BUG REPORTS
When reporting a bug, explain what happened, what you expected, what actually happened, and steps to reproduce it when possible.

7. SUGGESTIONS
Suggestions are welcome. Explain what you want changed or added and why it would improve Resolve or the community.

8. NO UNAUTHORIZED ADVERTISING
Do not advertise unrelated servers, bots, products, services, or communities unless specifically permitted.

9. KEEP CONTENT APPROPRIATE
Keep content appropriate for the community and do not post harmful or otherwise inappropriate material.

10. FOLLOW DISCORD RULES
All members must follow Discord's Terms of Service and Community Guidelines.

11. STAFF DIRECTIONS
Follow reasonable instructions from authorized Support Team members and moderators.

12. NO IMPERSONATION
Do not impersonate Resolve developers, moderators, Support Team members, or other community members.

13. PROTECT PRIVATE INFORMATION
Do not share passwords, tokens, private account information, or other confidential information.

14. NO MALICIOUS ACTIVITY
Do not use the community to organize or promote scams, attacks, account compromise, or other malicious activity.

15. RULE ENFORCEMENT
Violations may result in warnings, message removal, restrictions, kicks, bans, or loss of access to Resolve services depending on the situation.

16. RULE UPDATES
Rules may change as Resolve develops. Important changes will be announced in 📢・announcements or 🚀・updates.

17. RESOLVE AI
Resolve should only provide server-specific information when reliable approved knowledge is available. If it does not know something, it should request human support rather than guess.

Thank you for being part of the Resolve community.
`;

    const embed =
        new EmbedBuilder()
            .setTitle(
                "📜 Resolve Community Rules"
            )
            .setDescription(
                "Please read and follow the official Resolve community rules."
            )
            .addFields(
                {
                    name: "🤝 Respect",
                    value:
                        "Be respectful to members and staff."
                },
                {
                    name: "🚫 No Spam",
                    value:
                        "Do not spam messages, mentions, reactions, commands, or channels."
                },
                {
                    name: "🎫 Support",
                    value:
                        "Use tickets correctly and provide useful information."
                },
                {
                    name: "🤖 AI",
                    value:
                        "Resolve must not invent server-specific information."
                },
                {
                    name: "📢 Updates",
                    value:
                        "Rule changes will be announced through official channels."
                }
            )
            .setFooter(setupFooter())
            .setTimestamp();

    return sendSetupEmbed(
        guild,
        channel,
        "rules",
        embed,
        "Official Knowledge • Community Rules",
        content
    );
}

/*
 * ABOUT RESOLVE
 */
async function setupAbout(
    guild,
    channel
) {
    const content = `
ABOUT RESOLVE

Resolve is an AI-powered support bot designed for Discord communities.

CORE FEATURES

AI SUPPORT
Resolve can answer support questions using approved server knowledge.

SUPPORT TICKETS
Members can open tickets to receive support.

HUMAN HANDOFF
If Resolve cannot confidently answer a question, it can hand the ticket to the Support Team.

KNOWLEDGE SYSTEM
Resolve can use approved rules, FAQs, announcements, updates, changelogs, events, support information, achievements, bug information, and suggestions.

AUTOMATIC KNOWLEDGE
Important information from official member-facing channels can be automatically added to Resolve's knowledge system.

NO GUESSING
Resolve should never invent server-specific rules, policies, dates, prices, commands, or procedures.
`;

    const embed =
        new EmbedBuilder()
            .setTitle(
                "🤖 About Resolve"
            )
            .setDescription(
                "AI-powered support for Discord communities."
            )
            .addFields(
                {
                    name: "🧠 AI Support",
                    value:
                        "Answers support questions using approved server knowledge."
                },
                {
                    name: "🎫 Support Tickets",
                    value:
                        "Members can receive support through tickets."
                },
                {
                    name: "👤 Human Handoff",
                    value:
                        "Unknown or uncertain questions can be sent to human Support Team members."
                },
                {
                    name: "📚 Knowledge",
                    value:
                        "Resolve can learn important information from official support-server channels."
                }
            )
            .setFooter(setupFooter())
            .setTimestamp();

    return sendSetupEmbed(
        guild,
        channel,
        "about",
        embed,
        "Official Knowledge • About Resolve",
        content
    );
}

/*
 * ANNOUNCEMENTS
 */
async function setupAnnouncements(
    guild,
    channel
) {
    const content = `
RESOLVE ANNOUNCEMENTS

This channel is used for important official announcements from the Resolve team.

Announcements may include:

• Major Resolve news
• Important service information
• Community announcements
• Important policy changes
• Major feature releases
• Service notices

Members should check this channel for official Resolve announcements.
`;

    const embed =
        new EmbedBuilder()
            .setTitle(
                "📢 Resolve Announcements"
            )
            .setDescription(
                "Official announcements and important news from the Resolve team will be posted here."
            )
            .addFields({
                name: "🔔 Stay Updated",
                value:
                    "Check this channel regularly for important Resolve news and announcements."
            })
            .setFooter(setupFooter())
            .setTimestamp();

    return sendSetupEmbed(
        guild,
        channel,
        "announcements",
        embed,
        "Official Knowledge • Announcements",
        content
    );
}

/*
 * UPDATES
 */
async function setupUpdates(
    guild,
    channel
) {
    const content = `
RESOLVE UPDATES

This channel contains official Resolve updates.

Updates may include:

• New features
• Improvements
• System changes
• New support functionality
• AI improvements
• Dashboard updates
• Ticket system updates
• Community changes

Check this channel to stay informed about changes to Resolve.
`;

    const embed =
        new EmbedBuilder()
            .setTitle(
                "🚀 Resolve Updates"
            )
            .setDescription(
                "Official product and community updates will be posted here."
            )
            .addFields({
                name: "🚀 What's New?",
                value:
                    "New Resolve features, improvements, and important changes will be shared here."
            })
            .setFooter(setupFooter())
            .setTimestamp();

    return sendSetupEmbed(
        guild,
        channel,
        "updates",
        embed,
        "Official Knowledge • Updates",
        content
    );
}

/*
 * CHANGELOG
 */
async function setupChangelog(
    guild,
    channel
) {
    const content = `
RESOLVE CHANGELOG

The changelog records important changes made to Resolve.

Changelog entries may include:

• Added features
• Changed features
• Fixed bugs
• Performance improvements
• AI changes
• Ticket system changes
• Dashboard changes
• Database or infrastructure improvements

The newest changelog entries should be posted in this channel.
`;

    const embed =
        new EmbedBuilder()
            .setTitle(
                "📝 Resolve Changelog"
            )
            .setDescription(
                "A history of important changes to Resolve."
            )
            .addFields({
                name: "📋 Changes",
                value:
                    "New features, fixes, improvements, and system changes will be documented here."
            })
            .setFooter(setupFooter())
            .setTimestamp();

    return sendSetupEmbed(
        guild,
        channel,
        "changelog",
        embed,
        "Official Knowledge • Changelog",
        content
    );
}

/*
 * SUPPORT
 */
async function setupSupport(
    guild,
    channel
) {
    const content = `
RESOLVE SUPPORT

If you need help with Resolve, use the official support system.

SUPPORT PROCESS

1. Open a support ticket.
2. Clearly explain your question or problem.
3. Provide relevant information.
4. Resolve will attempt to help using approved server knowledge.
5. If Resolve cannot confidently answer, human support may be requested.
6. A member of the Support Team can then assist.

TICKET GUIDELINES

• Do not spam tickets.
• Do not create duplicate tickets.
• Be respectful to Support Team members.
• Provide accurate information.
• Be patient while waiting for assistance.

For bugs, use 🐛・bug-reports.
For suggestions, use 💡・suggestions.
For general information, check ❓・faq.
`;

    const embed =
        new EmbedBuilder()
            .setTitle(
                "🎫 Resolve Support"
            )
            .setDescription(
                "Need help with Resolve? Use the support system to get assistance."
            )
            .addFields(
                {
                    name: "1️⃣ Open a Ticket",
                    value:
                        "Create a support ticket and explain your issue."
                },
                {
                    name: "2️⃣ Resolve Helps",
                    value:
                        "Resolve will use approved knowledge to try to answer."
                },
                {
                    name: "3️⃣ Human Support",
                    value:
                        "If Resolve cannot confidently help, the Support Team can take over."
                }
            )
            .setFooter(setupFooter())
            .setTimestamp();

    return sendSetupEmbed(
        guild,
        channel,
        "support",
        embed,
        "Official Knowledge • Support",
        content
    );
}

/*
 * FAQ
 */
async function setupFAQ(
    guild,
    channel
) {
    const content = `
RESOLVE FAQ

Q: WHAT IS RESOLVE?
A: Resolve is an AI-powered support bot for Discord communities.

Q: WHAT DOES RESOLVE DO?
A: Resolve helps communities manage support tickets and answer questions using approved knowledge.

Q: HOW DOES THE AI KNOW SERVER INFORMATION?
A: Resolve can use approved knowledge containing information such as rules, FAQs, announcements, updates, changelogs, events, and support information.

Q: DOES RESOLVE GUESS ANSWERS?
A: Resolve should not guess server-specific information. If it does not have enough reliable information, it should request human support.

Q: CAN A HUMAN TAKE OVER?
A: Yes. When AI support is insufficient, a ticket can be handed to the Support Team.

Q: WHERE DO I REPORT A BUG?
A: Use 🐛・bug-reports.

Q: WHERE DO I MAKE A SUGGESTION?
A: Use 💡・suggestions.

Q: WHERE CAN I FIND EVENTS?
A: Check 🎉・events.

Q: WHERE ARE IMPORTANT UPDATES?
A: Check 📢・announcements, 🚀・updates, and 📝・changelog.

Q: WHERE ARE THE RULES?
A: Check 📜・rules.
`;

    const embed =
        new EmbedBuilder()
            .setTitle(
                "❓ Resolve FAQ"
            )
            .setDescription(
                "Frequently asked questions about Resolve."
            )
            .addFields(
                {
                    name: "🤖 What is Resolve?",
                    value:
                        "An AI-powered support bot for Discord communities."
                },
                {
                    name: "🧠 How does it know information?",
                    value:
                        "It uses approved server knowledge."
                },
                {
                    name: "👤 What if it doesn't know?",
                    value:
                        "It can request human support instead of guessing."
                },
                {
                    name: "🐛 Bugs",
                    value:
                        "Report them in 🐛・bug-reports."
                },
                {
                    name: "💡 Suggestions",
                    value:
                        "Post them in 💡・suggestions."
                }
            )
            .setFooter(setupFooter())
            .setTimestamp();

    return sendSetupEmbed(
        guild,
        channel,
        "faq",
        embed,
        "Official Knowledge • FAQ",
        content
    );
}

/*
 * ACHIEVEMENTS
 */
async function setupAchievements(
    guild,
    channel
) {
    const content = `
RESOLVE ACHIEVEMENTS

Resolve has a community achievement system.

Achievements can be earned by participating in the Resolve community and using Resolve's features.

EXAMPLES OF ACHIEVEMENT CATEGORIES

👋 COMMUNITY
Joining and participating in the Resolve community.

🎫 SUPPORT
Using the support system and participating in support activity.

🧠 KNOWLEDGE
Using Resolve and discovering its knowledge-powered support features.

🤖 RESOLVE
Using Resolve's AI support functionality.

💬 COMMUNITY
Participating in community conversations.

🏆 MILESTONES
Reaching larger activity milestones can unlock special achievements.

💎 ACHIEVEMENT MASTER
Special achievement milestones may be awarded for collecting many achievements.

👑 RESOLVE OG
A special early-community achievement.
`;

    const embed =
        new EmbedBuilder()
            .setTitle(
                "🏆 Resolve Achievements"
            )
            .setDescription(
                "Participate in the community and use Resolve to unlock achievements."
            )
            .addFields(
                {
                    name: "👋 Community",
                    value:
                        "Participate in the Resolve community."
                },
                {
                    name: "🎫 Support",
                    value:
                        "Use the support system."
                },
                {
                    name: "🧠 Knowledge",
                    value:
                        "Use Resolve and its knowledge features."
                },
                {
                    name: "💎 Milestones",
                    value:
                        "Reach activity milestones to unlock special achievements."
                }
            )
            .setFooter(setupFooter())
            .setTimestamp();

    return sendSetupEmbed(
        guild,
        channel,
        "achievements",
        embed,
        "Official Knowledge • Achievements",
        content
    );
}

/*
 * EVENTS
 */
async function setupEvents(
    guild,
    channel
) {
    const content = `
RESOLVE COMMUNITY EVENTS

This channel is used for official Resolve community events.

Events may include:

• Community activities
• Resolve events
• Competitions
• Special community activities
• Achievement events
• Community announcements related to events

Always check this channel for current event information.

Event information can change, so the newest official event announcement should be treated as the most current information.
`;

    const embed =
        new EmbedBuilder()
            .setTitle(
                "🎉 Resolve Events"
            )
            .setDescription(
                "Official Resolve community events will be announced here."
            )
            .addFields({
                name: "🎉 Community Events",
                value:
                    "Check this channel for current events, activities, competitions, and special community announcements."
            })
            .setFooter(setupFooter())
            .setTimestamp();

    return sendSetupEmbed(
        guild,
        channel,
        "events",
        embed,
        "Official Knowledge • Events",
        content
    );
}

/*
 * SUGGESTIONS
 */
async function setupSuggestions(
    guild,
    channel
) {
    const content = `
RESOLVE SUGGESTIONS

Suggestions for improving Resolve and the community are welcome.

WHEN MAKING A SUGGESTION

• Clearly explain your idea.
• Explain why it would be useful.
• Explain how it could improve Resolve or the community.
• Keep suggestions respectful and constructive.

Suggestions are reviewed by the Resolve team.

Submitting a suggestion does not guarantee that it will be implemented.
`;

    const embed =
        new EmbedBuilder()
            .setTitle(
                "💡 Resolve Suggestions"
            )
            .setDescription(
                "Have an idea for improving Resolve? Share it here."
            )
            .addFields(
                {
                    name: "💡 Explain Your Idea",
                    value:
                        "Clearly describe what you want added or changed."
                },
                {
                    name: "📈 Explain the Benefit",
                    value:
                        "Tell the team why your idea would improve Resolve."
                },
                {
                    name: "📋 Review",
                    value:
                        "Suggestions are reviewed by the Resolve team and are not guaranteed to be implemented."
                }
            )
            .setFooter(setupFooter())
            .setTimestamp();

    return sendSetupEmbed(
        guild,
        channel,
        "suggestions",
        embed,
        "Official Knowledge • Suggestions",
        content
    );
}

/*
 * BUG REPORTS
 */
async function setupBugReports(
    guild,
    channel
) {
    const content = `
RESOLVE BUG REPORTS

Found a problem with Resolve? Report it here.

A GOOD BUG REPORT SHOULD INCLUDE

• What happened
• What you expected to happen
• What actually happened
• Steps to reproduce the issue
• The relevant command or feature
• Screenshots or other useful information when appropriate

DO NOT INTENTIONALLY ABUSE OR EXPLOIT A BUG.

Serious security issues should be reported privately through the appropriate Resolve support process.

Bug reports may be reviewed, investigated, and added to the official Resolve updates or changelog when appropriate.
`;

    const embed =
        new EmbedBuilder()
            .setTitle(
                "🐛 Resolve Bug Reports"
            )
            .setDescription(
                "Found a bug? Please report it with as much useful information as possible."
            )
            .addFields(
                {
                    name: "1️⃣ Explain the Problem",
                    value:
                        "Tell us exactly what happened."
                },
                {
                    name: "2️⃣ Explain Expected Behavior",
                    value:
                        "Tell us what you expected to happen."
                },
                {
                    name: "3️⃣ Reproduction",
                    value:
                        "Include steps that can help the team reproduce the issue."
                },
                {
                    name: "📸 Evidence",
                    value:
                        "Screenshots and other relevant information can help."
                }
            )
            .setFooter(setupFooter())
            .setTimestamp();

    return sendSetupEmbed(
        guild,
        channel,
        "bugs",
        embed,
        "Official Knowledge • Bug Reports",
        content
    );
}

/*
 * Send a simple information embed to channels
 * that don't need a full knowledge source.
 */
async function setupSimpleChannel(
    guild,
    channel,
    title,
    description
) {
    const embed =
        new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setFooter(setupFooter())
            .setTimestamp();

    return sendSetupEmbed(
        guild,
        channel,
        title,
        embed,
        `Official Knowledge • ${title}`,
        description
    );
}

/*
 * Setup all official knowledge content.
 */
async function populateKnowledgeChannels(
    guild,
    channels
) {
    let sent = 0;

    const handlers = {
        "👋・welcome":
            setupWelcome,
        "📜・rules":
            setupRules,
        "🤖・about-resolve":
            setupAbout,
        "📢・announcements":
            setupAnnouncements,
        "🚀・updates":
            setupUpdates,
        "📝・changelog":
            setupChangelog,
        "🎫・support":
            setupSupport,
        "❓・faq":
            setupFAQ,
        "🏆・achievements":
            setupAchievements,
        "🎉・events":
            setupEvents,
        "💡・suggestions":
            setupSuggestions,
        "🐛・bug-reports":
            setupBugReports
    };

    for (
        const [channelName, handler]
        of Object.entries(handlers)
    ) {
        const channel =
            channels.get(channelName);

        if (!channel) {
            continue;
        }

        const result =
            await handler(
                guild,
                channel
            );

        if (result) {
            sent++;
        }
    }

    /*
     * Simple informational channels.
     */
    const simpleChannels = [
        [
            "🎭・reaction-roles",
            "🎭 Reaction Roles",
            "Use the available reaction roles to customize your Resolve community experience."
        ],
        [
            "🎨・colors",
            "🎨 Color Roles",
            "Choose an available color role to customize your server profile."
        ],
        [
            "🖼️・showcase",
            "🖼️ Community Showcase",
            "Share appropriate community creations and projects here."
        ]
    ];

    for (
        const [
            channelName,
            title,
            description
        ] of simpleChannels
    ) {
        const channel =
            channels.get(channelName);

        if (!channel) {
            continue;
        }

        const result =
            await setupSimpleChannel(
                guild,
                channel,
                title,
                description
            );

        if (result) {
            sent++;
        }
    }

    return sent;
}

/*
 * Make sure old automatic knowledge is not
 * duplicated by a previous server setup.
 */
async function cleanupOldSetupKnowledge(
    guild
) {
    try {
        await db.query(
            `
            DELETE FROM knowledge
            WHERE guild_id = $1
            AND title LIKE 'Official Knowledge •%'
            `,
            [guild.id]
        );

        console.log(
            "🧹 Removed previous official setup knowledge."
        );
    } catch (error) {
        console.error(
            "⚠️ Could not clean previous setup knowledge:",
            error
        );
    }
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
             * Official server only.
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
             * Administrator or bot owner.
             */
            if (
                !canManageServer(interaction)
            ) {
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

            console.log(
                "================================="
            );

            console.log(
                "🚀 Starting Resolve server setup..."
            );

            /*
             * Database.
             */
            await setupDatabase(guild);

            /*
             * Roles.
             */
            console.log(
                "🎭 Creating roles..."
            );

            const rolesCreated =
                await createRoles(guild);

            /*
             * Channels.
             */
            console.log(
                "🏗️ Creating server structure..."
            );

            const channels =
                new Map();

            let channelsCreated = 0;

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
                    const channelName
                    of channelNames
                ) {
                    const result =
                        await getOrCreateChannel(
                            guild,
                            channelName,
                            category
                        );

                    channels.set(
                        channelName,
                        result.channel
                    );

                    if (result.created) {
                        channelsCreated++;
                    }
                }
            }

            /*
             * Find support role.
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
             * Remove old official knowledge records.
             *
             * The actual setup messages are then inserted
             * again below, giving us one clean source of truth.
             */
            await cleanupOldSetupKnowledge(
                guild
            );

            /*
             * Send all official information.
             */
            console.log(
                "📚 Sending official Resolve information..."
            );

            const informationSent =
                await populateKnowledgeChannels(
                    guild,
                    channels
                );

            /*
             * Report.
             */
            const embed =
                new EmbedBuilder()
                    .setTitle(
                        "✅ Resolve Server Setup Complete"
                    )
                    .setDescription(
                        "The official Resolve Support Server has been configured and its information has been added to the AI knowledge base."
                    )
                    .addFields(
                        {
                            name: "🎭 Roles",
                            value:
                                `${SERVER_ROLES.length} configured\n${rolesCreated} created`,
                            inline: true
                        },
                        {
                            name: "📁 Channels",
                            value:
                                `${Object.values(
                                    SERVER_STRUCTURE
                                ).flat().length} configured\n${channelsCreated} created`,
                            inline: true
                        },
                        {
                            name: "🧠 Knowledge",
                            value:
                                `${informationSent} information sections sent and saved`,
                            inline: true
                        },
                        {
                            name: "👀 Watched Channels",
                            value:
                                AUTO_KNOWLEDGE_CHANNELS
                                    .map(
                                        name =>
                                            `• ${name}`
                                    )
                                    .join("\n"),
                            inline: false
                        }
                    )
                    .setFooter({
                        text:
                            "Resolve • AI-powered support for Discord"
                    })
                    .setTimestamp();

            await interaction.editReply({
                embeds: [embed]
            });

            console.log(
                "✅ Resolve server setup complete!"
            );

            console.log(
                `📚 Information sections sent: ${informationSent}`
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
                            "Check the Deploy Hatch logs for the full error."
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