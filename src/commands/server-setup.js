const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/db");

const SUPPORT_SERVER_ID = "1545866787059671100";

const SETUP_FOOTER = "Resolve • Official Server Setup";

/* =========================================================
   SERVER ROLES
========================================================= */

const SERVER_ROLES = [
    { name: "🔧 Support Team", color: 0x5865F2 },
    { name: "🛡️ Moderator", color: 0x57F287 },
    { name: "📢 Announcements", color: 0xFEE75C },
    { name: "🚀 Updates", color: 0x5865F2 },
    { name: "🐛 Bug Hunter", color: 0xED4245 },
    { name: "💡 Idea Maker", color: 0xFEE75C },
    { name: "👋 Resolve Member", color: 0x57F287 },
    { name: "🎫 First Ticket", color: 0x5865F2 },
    { name: "🧠 Knowledge Seeker", color: 0x9B59B6 },
    { name: "🤖 Resolve Explorer", color: 0x5865F2 },
    { name: "💬 Community Member", color: 0x57F287 },
    { name: "🏆 Support Veteran", color: 0xF1C40F },
    { name: "⭐ Support Legend", color: 0xE67E22 },
    { name: "💎 Achievement Master", color: 0x9B59B6 },
    { name: "👑 Resolve OG", color: 0xF1C40F }
];

/* =========================================================
   SERVER STRUCTURE
========================================================= */

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

/* =========================================================
   OFFICIAL KNOWLEDGE CONTENT
========================================================= */

const KNOWLEDGE = {

    "👋・welcome": {
        knowledgeTitle: "Official Knowledge • Welcome",
        embed: {
            title: "👋 Welcome to Resolve",
            description:
                "Welcome to the official **Resolve Support Server**.\n\n" +
                "Resolve is an AI-powered support platform built to help Discord communities provide faster, smarter, and more reliable support.",
            fields: [
                {
                    name: "🤖 What is Resolve?",
                    value:
                        "AI-powered support designed for Discord communities."
                },
                {
                    name: "🎫 Need Help?",
                    value:
                        "Use **🎫・support** to get assistance."
                },
                {
                    name: "📚 Learn More",
                    value:
                        "Check **📜・rules**, **🤖・about-resolve**, and **❓・faq**."
                },
                {
                    name: "🏆 Get Involved",
                    value:
                        "Participate in the community, events, support system, and achievement system."
                }
            ]
        },
        content: `
WELCOME TO RESOLVE

Welcome to the official Resolve Support Server.

Resolve is an AI-powered support platform built to help Discord communities provide faster, smarter, and more reliable support.

Members can learn about Resolve, receive support, read FAQs, view announcements and updates, report bugs, submit suggestions, participate in events, and earn achievements.

Important official information can be stored in Resolve's knowledge system and used by its AI support features.
`
    },

    "📜・rules": {
        knowledgeTitle: "Official Knowledge • Community Rules",
        embed: {
            title: "📜 Resolve Community Rules",
            description:
                "Please read and follow these rules while participating in the official Resolve community.",
            fields: [
                {
                    name: "🤝 Respect",
                    value:
                        "Treat members, Support Team members, moderators, developers, and staff respectfully."
                },
                {
                    name: "🚫 No Spam",
                    value:
                        "Do not spam messages, mentions, reactions, commands, or channels."
                },
                {
                    name: "🎫 Support",
                    value:
                        "Use tickets correctly, provide useful information, and avoid duplicate tickets."
                },
                {
                    name: "🛡️ Safety",
                    value:
                        "Do not share private information or participate in malicious activity."
                },
                {
                    name: "🤖 Resolve AI",
                    value:
                        "Resolve should never invent server-specific information when reliable knowledge is unavailable."
                },
                {
                    name: "📋 Enforcement",
                    value:
                        "Rule violations may result in warnings, restrictions, kicks, bans, or loss of access."
                }
            ]
        },
        content: `
RESOLVE COMMUNITY RULES

Welcome to the official Resolve Support Server.

1. BE RESPECTFUL
Treat members, Support Team members, moderators, developers, and staff with respect.

2. NO SPAM
Do not spam messages, mentions, reactions, commands, or channels.

3. USE THE CORRECT CHANNELS
Keep questions, bugs, suggestions, events, general conversations, and support requests in their appropriate channels.

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
Keep content appropriate for the community.

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
Violations may result in warnings, message removal, restrictions, kicks, bans, or loss of access.

16. RULE UPDATES
Rules may change as Resolve develops. Important changes will be announced in 📢・announcements or 🚀・updates.

17. RESOLVE AI
Resolve should only provide server-specific information when reliable approved knowledge is available. If it does not know something, it should request human support instead of guessing.
`
    },

    "🤖・about-resolve": {
        knowledgeTitle: "Official Knowledge • About Resolve",
        embed: {
            title: "🤖 About Resolve",
            description:
                "AI-powered support built specifically for Discord communities.",
            fields: [
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
                        "Questions Resolve cannot confidently answer can be handed to human staff."
                },
                {
                    name: "📚 Knowledge System",
                    value:
                        "Official rules, FAQs, updates, announcements, events, and other information can be used as knowledge."
                },
                {
                    name: "🚫 No Guessing",
                    value:
                        "Resolve should not invent server-specific information."
                }
            ]
        },
        content: `
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
Important information from official member-facing channels can automatically be added to Resolve's knowledge system.

NO GUESSING
Resolve should never invent server-specific rules, policies, dates, prices, commands, or procedures.
`
    },

    "📢・announcements": {
        knowledgeTitle: "Official Knowledge • Announcements",
        embed: {
            title: "📢 Resolve Announcements",
            description:
                "Official announcements and important news from the Resolve team.",
            fields: [
                {
                    name: "🔔 Important News",
                    value:
                        "Major Resolve news and important community information."
                },
                {
                    name: "🛠️ Service Information",
                    value:
                        "Important service notices and changes."
                },
                {
                    name: "📋 Policy Changes",
                    value:
                        "Major policy or community changes."
                }
            ]
        },
        content: `
RESOLVE ANNOUNCEMENTS

This channel contains official announcements from the Resolve team.

Announcements may include:

• Major Resolve news
• Important service information
• Community announcements
• Policy changes
• Major feature releases
• Service notices

Members should check this channel for official Resolve announcements.
`
    },

    "🚀・updates": {
        knowledgeTitle: "Official Knowledge • Updates",
        embed: {
            title: "🚀 Resolve Updates",
            description:
                "Official product, system, and community updates.",
            fields: [
                {
                    name: "✨ New Features",
                    value:
                        "New Resolve functionality and features."
                },
                {
                    name: "🔧 Improvements",
                    value:
                        "Improvements to existing systems."
                },
                {
                    name: "🧠 AI Improvements",
                    value:
                        "Changes and improvements to Resolve's AI."
                },
                {
                    name: "🎫 Support Updates",
                    value:
                        "Updates to tickets and support functionality."
                }
            ]
        },
        content: `
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
`
    },

    "📝・changelog": {
        knowledgeTitle: "Official Knowledge • Changelog",
        embed: {
            title: "📝 Resolve Changelog",
            description:
                "A record of important changes made to Resolve.",
            fields: [
                {
                    name: "✨ Added",
                    value:
                        "New features and functionality."
                },
                {
                    name: "🔧 Changed",
                    value:
                        "Updates and improvements to existing features."
                },
                {
                    name: "🐛 Fixed",
                    value:
                        "Bug fixes and issue resolutions."
                },
                {
                    name: "⚡ Improved",
                    value:
                        "Performance, AI, database, and infrastructure improvements."
                }
            ]
        },
        content: `
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
• Infrastructure improvements

The newest changelog entries should be posted in this channel.
`
    },

    "🎫・support": {
        knowledgeTitle: "Official Knowledge • Support",
        embed: {
            title: "🎫 Resolve Support",
            description:
                "Need help with Resolve? Follow the support process below.",
            fields: [
                {
                    name: "1️⃣ Open a Ticket",
                    value:
                        "Create a support ticket and clearly explain your issue."
                },
                {
                    name: "2️⃣ Resolve Helps",
                    value:
                        "Resolve will use approved knowledge to try to answer."
                },
                {
                    name: "3️⃣ Human Support",
                    value:
                        "If Resolve cannot confidently help, human staff can take over."
                },
                {
                    name: "⚠️ Please Remember",
                    value:
                        "Do not spam or create duplicate tickets."
                }
            ]
        },
        content: `
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
`
    },

    "❓・faq": {
        knowledgeTitle: "Official Knowledge • FAQ",
        embed: {
            title: "❓ Resolve FAQ",
            description:
                "Frequently asked questions about Resolve.",
            fields: [
                {
                    name: "🤖 What is Resolve?",
                    value:
                        "An AI-powered support bot for Discord communities."
                },
                {
                    name: "🧠 How does it know information?",
                    value:
                        "Resolve uses approved server knowledge."
                },
                {
                    name: "🚫 Does Resolve guess?",
                    value:
                        "No. It should request human support when reliable information is unavailable."
                },
                {
                    name: "👤 Can humans help?",
                    value:
                        "Yes. Tickets can be handed to the Support Team."
                },
                {
                    name: "🐛 Bug Reports",
                    value:
                        "Use 🐛・bug-reports."
                },
                {
                    name: "💡 Suggestions",
                    value:
                        "Use 💡・suggestions."
                },
                {
                    name: "🎉 Events",
                    value:
                        "Check 🎉・events."
                }
            ]
        },
        content: `
RESOLVE FAQ

Q: WHAT IS RESOLVE?
A: Resolve is an AI-powered support bot for Discord communities.

Q: WHAT DOES RESOLVE DO?
A: Resolve helps communities manage support tickets and answer questions using approved knowledge.

Q: HOW DOES THE AI KNOW SERVER INFORMATION?
A: Resolve can use approved knowledge containing rules, FAQs, announcements, updates, changelogs, events, and support information.

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
`
    },

    "🏆・achievements": {
        knowledgeTitle: "Official Knowledge • Achievements",
        embed: {
            title: "🏆 Resolve Achievements",
            description:
                "Participate in the Resolve community and unlock achievements.",
            fields: [
                {
                    name: "👋 Community",
                    value:
                        "Join and participate in the community."
                },
                {
                    name: "🎫 Support",
                    value:
                        "Use the support system and participate in support activity."
                },
                {
                    name: "🧠 Knowledge",
                    value:
                        "Use Resolve and explore its knowledge-powered features."
                },
                {
                    name: "🤖 Resolve",
                    value:
                        "Use Resolve's AI support functionality."
                },
                {
                    name: "🏆 Milestones",
                    value:
                        "Reach activity milestones."
                },
                {
                    name: "💎 Special Achievements",
                    value:
                        "Collect achievements and unlock special community milestones."
                }
            ]
        },
        content: `
RESOLVE ACHIEVEMENTS

Resolve has a community achievement system.

Achievements can be earned by participating in the Resolve community and using Resolve's features.

ACHIEVEMENT CATEGORIES

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
Reaching activity milestones can unlock special achievements.

💎 ACHIEVEMENT MASTER
A special achievement milestone for collecting many achievements.

👑 RESOLVE OG
A special early-community achievement.
`
    },

    "🎉・events": {
        knowledgeTitle: "Official Knowledge • Events",
        embed: {
            title: "🎉 Resolve Community Events",
            description:
                "Official Resolve community events, activities, competitions, and special events.",
            fields: [
                {
                    name: "🎉 Community Activities",
                    value:
                        "Community events and activities."
                },
                {
                    name: "🏆 Competitions",
                    value:
                        "Special competitions and challenges."
                },
                {
                    name: "💎 Achievement Events",
                    value:
                        "Events connected to community achievements."
                },
                {
                    name: "📢 Current Information",
                    value:
                        "Always use the newest official event announcement as the current information."
                }
            ]
        },
        content: `
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
`
    },

    "💡・suggestions": {
        knowledgeTitle: "Official Knowledge • Suggestions",
        embed: {
            title: "💡 Resolve Suggestions",
            description:
                "Have an idea for improving Resolve or the community? Share it here.",
            fields: [
                {
                    name: "💡 Explain Your Idea",
                    value:
                        "Clearly describe what you want added or changed."
                },
                {
                    name: "📈 Explain the Benefit",
                    value:
                        "Explain why your idea would improve Resolve or the community."
                },
                {
                    name: "🤝 Stay Constructive",
                    value:
                        "Keep suggestions respectful and useful."
                },
                {
                    name: "📋 Review",
                    value:
                        "Suggestions are reviewed by the Resolve team and are not guaranteed to be implemented."
                }
            ]
        },
        content: `
RESOLVE SUGGESTIONS

Suggestions for improving Resolve and the community are welcome.

WHEN MAKING A SUGGESTION

• Clearly explain your idea.
• Explain why it would be useful.
• Explain how it could improve Resolve or the community.
• Keep suggestions respectful and constructive.

Suggestions are reviewed by the Resolve team.

Submitting a suggestion does not guarantee that it will be implemented.
`
    },

    "🐛・bug-reports": {
        knowledgeTitle: "Official Knowledge • Bug Reports",
        embed: {
            title: "🐛 Resolve Bug Reports",
            description:
                "Found a problem with Resolve? Report it here with as much useful information as possible.",
            fields: [
                {
                    name: "1️⃣ What Happened?",
                    value:
                        "Explain the problem clearly."
                },
                {
                    name: "2️⃣ Expected Behavior",
                    value:
                        "Explain what you expected to happen."
                },
                {
                    name: "3️⃣ Reproduce",
                    value:
                        "Include steps that can reproduce the issue."
                },
                {
                    name: "4️⃣ Useful Information",
                    value:
                        "Include the command, feature, screenshots, or other relevant details."
                },
                {
                    name: "⚠️ Important",
                    value:
                        "Do not intentionally abuse or exploit bugs."
                }
            ]
        },
        content: `
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

Bug reports may be reviewed, investigated, and added to official Resolve updates or changelog information when appropriate.
`
    },

    "🎭・reaction-roles": {
        knowledgeTitle: "Official Knowledge • Reaction Roles",
        embed: {
            title: "🎭 Reaction Roles",
            description:
                "Use the available role system to customize your Resolve community experience.",
            fields: [
                {
                    name: "🎭 Roles",
                    value:
                        "Choose available community roles when provided."
                },
                {
                    name: "✨ Customize",
                    value:
                        "Roles can help personalize your server experience."
                }
            ]
        },
        content:
            "REACTION ROLES\n\nUse the available role system to customize your Resolve community experience."
    },

    "🎨・colors": {
        knowledgeTitle: "Official Knowledge • Color Roles",
        embed: {
            title: "🎨 Color Roles",
            description:
                "Choose an available color role to customize your server profile.",
            fields: [
                {
                    name: "🎨 Customize",
                    value:
                        "Select an available color role when provided."
                }
            ]
        },
        content:
            "COLOR ROLES\n\nChoose an available color role to customize your server profile."
    },

    "🖼️・showcase": {
        knowledgeTitle: "Official Knowledge • Community Showcase",
        embed: {
            title: "🖼️ Community Showcase",
            description:
                "Share appropriate community creations, projects, and work.",
            fields: [
                {
                    name: "🖼️ Share",
                    value:
                        "Show the community what you've created."
                },
                {
                    name: "🤝 Community",
                    value:
                        "Keep shared content appropriate and respectful."
                }
            ]
        },
        content:
            "COMMUNITY SHOWCASE\n\nShare appropriate community creations, projects, and work with the Resolve community."
    }
};

/* =========================================================
   DATABASE SETUP
========================================================= */

async function setupDatabase(guild) {

    await db.query(`
        INSERT INTO guilds (
            guild_id,
            guild_name
        )
        VALUES ($1, $2)
        ON CONFLICT (guild_id)
        DO UPDATE SET
            guild_name = EXCLUDED.guild_name
    `, [
        guild.id,
        guild.name
    ]);

    await db.query(`
        INSERT INTO guild_settings (
            guild_id,
            ai_enabled
        )
        VALUES ($1, TRUE)
        ON CONFLICT (guild_id)
        DO NOTHING
    `, [
        guild.id
    ]);

    await db.query(`
        ALTER TABLE knowledge
        ADD COLUMN IF NOT EXISTS source_channel_id TEXT
    `);

    await db.query(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_source_channel
        ON knowledge(guild_id, source_channel_id)
    `);
}

/* =========================================================
   ROLES
========================================================= */

async function createRoles(guild) {

    let created = 0;

    for (const roleData of SERVER_ROLES) {

        const existing = guild.roles.cache.find(
            role => role.name === roleData.name
        );

        if (existing) continue;

        try {

            await guild.roles.create({
                name: roleData.name,
                color: roleData.color,
                reason: "Resolve Support Server Setup"
            });

            created++;

        } catch (error) {

            console.error(
                `❌ Failed creating role ${roleData.name}:`,
                error
            );
        }
    }

    return created;
}

/* =========================================================
   CHANNELS
========================================================= */

function findCategory(guild, name) {

    return guild.channels.cache.find(
        channel =>
            channel.type === ChannelType.GuildCategory &&
            channel.name === name
    );
}

function findChannel(guild, name) {

    return guild.channels.cache.find(
        channel =>
            channel.type === ChannelType.GuildText &&
            channel.name === name
    );
}

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
            await channel.setParent(
                category.id
            ).catch(() => {});
        }

        return {
            channel,
            created: false
        };
    }

    channel = await guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: category?.id || null,
        reason: "Resolve Support Server Setup"
    });

    return {
        channel,
        created: true
    };
}

/* =========================================================
   FIND EXISTING SETUP MESSAGE
========================================================= */

async function findSetupMessage(
    guild,
    channel,
    embedTitle
) {

    try {

        const messages =
            await channel.messages.fetch({
                limit: 100
            });

        return messages.find(
            message =>
                message.author.id ===
                    guild.client.user.id &&
                message.embeds.some(
                    embed =>
                        embed.title === embedTitle &&
                        embed.footer?.text === SETUP_FOOTER
                )
        ) || null;

    } catch (error) {

        console.error(
            `❌ Could not search #${channel.name}:`,
            error
        );

        return null;
    }
}

/* =========================================================
   BUILD EMBED
========================================================= */

function buildSetupEmbed(data) {

    return new EmbedBuilder()
        .setTitle(data.title)
        .setDescription(data.description)
        .addFields(data.fields || [])
        .setFooter({
            text: SETUP_FOOTER
        })
        .setTimestamp();
}

/* =========================================================
   CREATE OR EDIT EMBED
========================================================= */

async function createOrUpdateEmbed(
    guild,
    channel,
    data
) {

    const embed =
        buildSetupEmbed(data);

    const existing =
        await findSetupMessage(
            guild,
            channel,
            data.title
        );

    if (existing) {

        await existing.edit({
            embeds: [embed]
        });

        console.log(
            `🔄 Edited setup embed in #${channel.name}`
        );

        return "updated";
    }

    await channel.send({
        embeds: [embed]
    });

    console.log(
        `📢 Created setup embed in #${channel.name}`
    );

    return "created";
}

/* =========================================================
   KNOWLEDGE UPSERT
========================================================= */

async function saveOfficialKnowledge(
    guild,
    channel,
    title,
    content
) {

    const botId =
        guild.members.me?.id ||
        guild.client.user.id;

    try {

        /*
         * Find all matching official setup entries.
         */
        const existing =
            await db.query(`
                SELECT id
                FROM knowledge
                WHERE guild_id = $1
                AND source_channel_id = $2
                AND title = $3
                ORDER BY id ASC
            `, [
                guild.id,
                channel.id,
                title
            ]);

        /*
         * No entry exists.
         */
        if (existing.rows.length === 0) {

            await db.query(`
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
            `, [
                guild.id,
                title,
                content,
                botId,
                channel.id
            ]);

            console.log(
                `🧠 Created knowledge: ${title}`
            );

            return "created";
        }

        /*
         * Keep the first record.
         */
        const keepId =
            existing.rows[0].id;

        /*
         * Remove accidental duplicates.
         */
        if (existing.rows.length > 1) {

            const duplicateIds =
                existing.rows
                    .slice(1)
                    .map(row => row.id);

            await db.query(`
                DELETE FROM knowledge
                WHERE id = ANY($1::bigint[])
            `, [
                duplicateIds
            ]);

            console.log(
                `🧹 Removed ${duplicateIds.length} duplicate knowledge entries for ${title}`
            );
        }

        /*
         * Update the official record.
         */
        await db.query(`
            UPDATE knowledge
            SET
                content = $1,
                approved = TRUE,
                updated_at = NOW()
            WHERE id = $2
        `, [
            content,
            keepId
        ]);

        console.log(
            `🔄 Updated knowledge: ${title}`
        );

        return "updated";

    } catch (error) {

        console.error(
            `❌ Knowledge error for #${channel.name}:`,
            error
        );

        return "failed";
    }
}

/* =========================================================
   PROCESS OFFICIAL INFORMATION
========================================================= */

async function processKnowledge(
    guild,
    channelName,
    channel
) {

    const data =
        KNOWLEDGE[channelName];

    if (!data) return null;

    const embedResult =
        await createOrUpdateEmbed(
            guild,
            channel,
            data.embed
        );

    const knowledgeResult =
        await saveOfficialKnowledge(
            guild,
            channel,
            data.knowledgeTitle,
            data.content
        );

    return {
        embedResult,
        knowledgeResult
    };
}

/* =========================================================
   MAIN SETUP
========================================================= */

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

            const ownerId =
                process.env.BOT_OWNER_ID;

            const isOwner =
                ownerId &&
                interaction.user.id === ownerId;

            const isAdmin =
                interaction.memberPermissions?.has(
                    PermissionFlagsBits.Administrator
                );

            if (!isOwner && !isAdmin) {

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
                "======================================"
            );

            console.log(
                "🚀 Starting Resolve server setup..."
            );

            /* DATABASE */

            await setupDatabase(guild);

            /* ROLES */

            const rolesCreated =
                await createRoles(guild);

            /* CHANNELS */

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
                        await guild.channels.create({
                            name: categoryName,
                            type: ChannelType.GuildCategory,
                            reason:
                                "Resolve Support Server Setup"
                        });
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

            /* SUPPORT ROLE */

            const supportRole =
                guild.roles.cache.find(
                    role =>
                        role.name ===
                        "🔧 Support Team"
                );

            if (supportRole) {

                await db.query(`
                    UPDATE guild_settings
                    SET
                        support_role_id = $1,
                        updated_at = NOW()
                    WHERE guild_id = $2
                `, [
                    supportRole.id,
                    guild.id
                ]);
            }

            /* OFFICIAL INFORMATION */

            let embedsCreated = 0;
            let embedsUpdated = 0;

            let knowledgeCreated = 0;
            let knowledgeUpdated = 0;

            for (
                const channelName
                of Object.keys(KNOWLEDGE)
            ) {

                const channel =
                    channels.get(channelName);

                if (!channel) {
                    continue;
                }

                const result =
                    await processKnowledge(
                        guild,
                        channelName,
                        channel
                    );

                if (!result) {
                    continue;
                }

                if (
                    result.embedResult ===
                    "created"
                ) {
                    embedsCreated++;
                }

                if (
                    result.embedResult ===
                    "updated"
                ) {
                    embedsUpdated++;
                }

                if (
                    result.knowledgeResult ===
                    "created"
                ) {
                    knowledgeCreated++;
                }

                if (
                    result.knowledgeResult ===
                    "updated"
                ) {
                    knowledgeUpdated++;
                }
            }

            /* FINAL RESPONSE */

            const finalEmbed =
                new EmbedBuilder()
                    .setTitle(
                        "✅ Resolve Setup Complete"
                    )
                    .setDescription(
                        "The official Resolve Support Server has been configured successfully.\n\n" +
                        "Existing Resolve setup messages were **edited instead of duplicated**, and the official information has been synchronized with the AI knowledge base."
                    )
                    .addFields(
                        {
                            name: "🎭 Roles",
                            value:
                                `${rolesCreated} created • ${SERVER_ROLES.length} configured`,
                            inline: true
                        },
                        {
                            name: "📁 Channels",
                            value:
                                `${channelsCreated} created`,
                            inline: true
                        },
                        {
                            name: "✨ Embeds",
                            value:
                                `${embedsCreated} created\n${embedsUpdated} updated`,
                            inline: true
                        },
                        {
                            name: "🧠 Knowledge",
                            value:
                                `${knowledgeCreated} created\n${knowledgeUpdated} updated`,
                            inline: true
                        },
                        {
                            name: "🔄 Future Setup Runs",
                            value:
                                "Running `/server-setup` again will edit the existing setup embeds and update their knowledge entries instead of creating duplicates.",
                            inline: false
                        }
                    )
                    .setFooter({
                        text:
                            "Resolve • AI-powered support for Discord"
                    })
                    .setTimestamp();

            await interaction.editReply({
                embeds: [finalEmbed]
            });

            console.log(
                "✅ Resolve server setup complete!"
            );

            console.log(
                `✨ Embeds created: ${embedsCreated}`
            );

            console.log(
                `🔄 Embeds updated: ${embedsUpdated}`
            );

            console.log(
                `🧠 Knowledge created: ${knowledgeCreated}`
            );

            console.log(
                `🔄 Knowledge updated: ${knowledgeUpdated}`
            );

            console.log(
                "======================================"
            );

        } catch (error) {

            console.error(
                "❌ Server setup failed:",
                error
            );

            const errorMessage =
                `❌ **Server setup failed.**\n\n\`${error.message || "Unknown error"}\``;

            try {

                if (
                    interaction.deferred ||
                    interaction.replied
                ) {

                    await interaction.editReply({
                        content:
                            errorMessage
                    });

                } else {

                    await interaction.reply({
                        content:
                            errorMessage,
                        ephemeral: true
                    });
                }

            } catch (replyError) {

                console.error(
                    "❌ Failed sending setup error:",
                    replyError
                );
            }
        }
    }
};