const {
    EmbedBuilder
} = require("discord.js");

const db = require("../database/db");

const SUPPORT_SERVER_ID = "1545866787059671100";

// ==========================================
// ACHIEVEMENT ROLE MAPPING
// ==========================================

const ACHIEVEMENT_ROLES = {
    welcome: "👋 Resolve Member",
    first_ticket: "🎫 First Ticket",
    bug_hunter: "🐛 Bug Hunter",
    idea_maker: "💡 Idea Maker",
    knowledge_seeker: "🧠 Knowledge Seeker",
    resolve_explorer: "🤖 Resolve Explorer",
    community_member: "💬 Community Member",
    support_veteran: "🏆 Support Veteran",
    support_legend: "⭐ Support Legend",
    achievement_master: "💎 Achievement Master",
    resolve_og: "👑 Resolve OG"
};

// ==========================================
// ACHIEVEMENT DEFINITIONS
// ==========================================

const ACHIEVEMENTS = {
    welcome: {
        name: "Welcome to Resolve",
        description:
            "You joined the official Resolve Support Server.",
        emoji: "👋"
    },

    reaction_role: {
        name: "Role Collector",
        description:
            "You picked your first reaction role.",
        emoji: "🎭"
    },

    color_role: {
        name: "Colorful",
        description:
            "You picked your first color role.",
        emoji: "🎨"
    },

    first_ticket: {
        name: "First Ticket",
        description:
            "You opened your first support ticket with Resolve.",
        emoji: "🎫"
    },

    regular_customer: {
        name: "Regular Customer",
        description:
            "You opened 5 support tickets.",
        emoji: "🔵"
    },

    support_veteran: {
        name: "Support Veteran",
        description:
            "You opened 25 support tickets.",
        emoji: "🏆"
    },

    support_legend: {
        name: "Support Legend",
        description:
            "You opened 100 support tickets.",
        emoji: "⭐"
    },

    issue_resolved: {
        name: "Issue Resolved",
        description:
            "Your first support ticket was successfully closed.",
        emoji: "✅"
    },

    bug_hunter: {
        name: "Bug Hunter",
        description:
            "You submitted your first bug report.",
        emoji: "🐛"
    },

    bug_tracker: {
        name: "Bug Tracker",
        description:
            "You submitted 5 bug reports.",
        emoji: "🔎"
    },

    bug_detective: {
        name: "Bug Detective",
        description:
            "You submitted 10 bug reports.",
        emoji: "🕵️"
    },

    quality_assurance: {
        name: "Quality Assurance",
        description:
            "You submitted 25 bug reports.",
        emoji: "🏅"
    },

    idea_maker: {
        name: "Idea Maker",
        description:
            "You submitted your first suggestion.",
        emoji: "💡"
    },

    innovator: {
        name: "Innovator",
        description:
            "You submitted 5 suggestions.",
        emoji: "🧠"
    },

    visionary: {
        name: "Visionary",
        description:
            "You submitted 10 suggestions.",
        emoji: "🚀"
    },

    community_helper: {
        name: "Community Helper",
        description:
            "You helped another member of the Resolve community.",
        emoji: "🌟"
    },

    first_message: {
        name: "First Message",
        description:
            "You sent your first community message.",
        emoji: "💬"
    },

    conversation_starter: {
        name: "Conversation Starter",
        description:
            "You sent 25 community messages.",
        emoji: "🗣️"
    },

    community_voice: {
        name: "Community Voice",
        description:
            "You sent 100 community messages.",
        emoji: "📣"
    },

    community_regular: {
        name: "Community Regular",
        description:
            "You sent 500 community messages.",
        emoji: "🌐"
    },

    event_attendee: {
        name: "Event Attendee",
        description:
            "You attended your first Resolve community event.",
        emoji: "🎉"
    },

    party_starter: {
        name: "Party Starter",
        description:
            "You attended 5 Resolve community events.",
        emoji: "🎊"
    },

    event_veteran: {
        name: "Event Veteran",
        description:
            "You attended 10 Resolve community events.",
        emoji: "🥳"
    },

    resolve_explorer: {
        name: "Resolve Explorer",
        description:
            "You used Resolve for the first time.",
        emoji: "🤖"
    },

    knowledge_seeker: {
        name: "Knowledge Seeker",
        description:
            "You asked Resolve for help.",
        emoji: "🧠"
    },

    quick_resolver: {
        name: "Quick Resolver",
        description:
            "Resolve successfully helped resolve your issue.",
        emoji: "⚡"
    },

    trusted_knowledge: {
        name: "Trusted Knowledge",
        description:
            "You contributed verified knowledge to Resolve.",
        emoji: "🔐"
    },

    early_adopter: {
        name: "Early Adopter",
        description:
            "You joined Resolve during its early days.",
        emoji: "🚀"
    },

    early_supporter: {
        name: "Early Supporter",
        description:
            "You supported Resolve during its early community period.",
        emoji: "🌟"
    },

    founding_member: {
        name: "Founding Member",
        description:
            "You were one of the early members of the Resolve community.",
        emoji: "💎"
    },

    resolve_og: {
        name: "Resolve OG",
        description:
            "You've been part of Resolve since the early days.",
        emoji: "👑"
    },

    achievement_hunter: {
        name: "Achievement Hunter",
        description:
            "You unlocked 10 Resolve achievements.",
        emoji: "🏆"
    },

    achievement_master: {
        name: "Achievement Master",
        description:
            "You unlocked 25 Resolve achievements.",
        emoji: "💎"
    }
};

// ==========================================
// AWARD ACHIEVEMENT
// ==========================================

async function awardAchievement({
    guild,
    userId,
    key,
    name,
    description,
    emoji = "🏆"
}) {
    try {
        if (!guild || !userId || !key || !name) {
            return false;
        }

        await db.query(
            `
            INSERT INTO guilds (
                guild_id,
                guild_name
            )
            VALUES ($1, $2)
            ON CONFLICT (guild_id)
            DO UPDATE SET guild_name = EXCLUDED.guild_name
            `,
            [
                guild.id,
                guild.name
            ]
        );

        const result = await db.query(
            `
            INSERT INTO achievements (
                guild_id,
                user_id,
                achievement_key,
                achievement_name,
                description,
                emoji
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (
                guild_id,
                user_id,
                achievement_key
            )
            DO NOTHING
            RETURNING id
            `,
            [
                guild.id,
                userId,
                key,
                name,
                description || "",
                emoji
            ]
        );

        if (result.rows.length === 0) {
            return false;
        }

        // ==========================================
        // GIVE ACHIEVEMENT ROLE
        // ==========================================

        if (guild.id === SUPPORT_SERVER_ID) {
            const roleName = ACHIEVEMENT_ROLES[key];

            if (roleName) {
                try {
                    const role = guild.roles.cache.find(
                        role => role.name === roleName
                    );

                    if (role) {
                        const member =
                            await guild.members.fetch(userId);

                        if (
                            !member.roles.cache.has(role.id) &&
                            role.editable
                        ) {
                            await member.roles.add(
                                role,
                                `Resolve achievement: ${name}`
                            );

                            console.log(
                                `🏅 Added ${role.name} to ${member.user.tag}`
                            );
                        }
                    } else {
                        console.log(
                            `⚠️ Achievement role not found: ${roleName}`
                        );
                    }
                } catch (error) {
                    console.error(
                        `❌ Achievement role error (${name}):`,
                        error
                    );
                }
            }
        }

        // ==========================================
        // ACHIEVEMENT EMBED
        // ==========================================

        const achievementEmbed = new EmbedBuilder()
            .setTitle("🏆 Achievement Unlocked!")
            .setDescription(
                `${emoji} **${name}**\n\n` +
                `${description || "You've unlocked a new achievement!"}`
            )
            .setColor(0xF1C40F)
            .setFooter({
                text: `Resolve • ${guild.name}`
            })
            .setTimestamp();

        // ==========================================
        // DM
        // ==========================================

        try {
            const user =
                await guild.client.users.fetch(userId);

            await user.send({
                embeds: [achievementEmbed]
            });

            console.log(
                `🏆 Achievement DM sent to ${user.tag}: ${name}`
            );
        } catch {
            console.log(
                `⚠️ Could not DM achievement recipient ${userId}.`
            );
        }

        // ==========================================
        // ACHIEVEMENT LOG
        // ==========================================

        const achievementChannel =
            guild.channels.cache.find(
                channel =>
                    channel.name === "📜・achievement-log" &&
                    channel.isTextBased()
            );

        if (achievementChannel) {
            const publicEmbed = new EmbedBuilder()
                .setTitle("🏆 Achievement Unlocked!")
                .setDescription(
                    `<@${userId}> unlocked a new achievement!`
                )
                .addFields(
                    {
                        name: "🏅 Achievement",
                        value:
                            `${emoji} **${name}**`,
                        inline: false
                    },
                    {
                        name: "📖 Description",
                        value:
                            description ||
                            "You've unlocked a new achievement!",
                        inline: false
                    }
                )
                .setColor(0xF1C40F)
                .setFooter({
                    text: "Resolve • Achievements"
                })
                .setTimestamp();

            await achievementChannel.send({
                embeds: [publicEmbed]
            });
        }

        console.log(
            `🏆 ${guild.name}: ${name} awarded to ${userId}`
        );

        return true;

    } catch (error) {
        console.error(
            "❌ Achievement error:",
            error
        );

        return false;
    }
}

// ==========================================
// GET USER ACHIEVEMENTS
// ==========================================

async function getUserAchievements(
    guildId,
    userId
) {
    const result = await db.query(
        `
        SELECT
            achievement_key,
            achievement_name,
            description,
            emoji,
            earned_at
        FROM achievements
        WHERE guild_id = $1
        AND user_id = $2
        ORDER BY earned_at ASC
        `,
        [
            guildId,
            userId
        ]
    );

    return result.rows;
}

// ==========================================
// GET ACHIEVEMENT COUNT
// ==========================================

async function getAchievementCount(
    guildId,
    userId
) {
    const result = await db.query(
        `
        SELECT COUNT(*)::int AS count
        FROM achievements
        WHERE guild_id = $1
        AND user_id = $2
        `,
        [
            guildId,
            userId
        ]
    );

    return result.rows[0].count;
}

// ==========================================
// CHECK ACHIEVEMENT MILESTONES
// ==========================================

async function checkAchievementMilestones(
    guild,
    userId
) {
    if (!guild || guild.id !== SUPPORT_SERVER_ID) {
        return;
    }

    try {
        const count =
            await getAchievementCount(
                guild.id,
                userId
            );

        if (count >= 10) {
            await awardAchievement({
                guild,
                userId,
                key: "achievement_hunter",
                name: "Achievement Hunter",
                description:
                    "You unlocked 10 Resolve achievements!",
                emoji: "🏆"
            });
        }

        if (count >= 25) {
            await awardAchievement({
                guild,
                userId,
                key: "achievement_master",
                name: "Achievement Master",
                description:
                    "You unlocked 25 Resolve achievements!",
                emoji: "💎"
            });
        }

    } catch (error) {
        console.error(
            "❌ Achievement milestone error:",
            error
        );
    }
}

// ==========================================
// CHECK TICKET ACHIEVEMENTS
// ==========================================

async function checkTicketAchievements(
    guild,
    userId
) {
    if (!guild || guild.id !== SUPPORT_SERVER_ID) {
        return;
    }

    try {
        const result = await db.query(
            `
            SELECT COUNT(*)::int AS count
            FROM tickets
            WHERE guild_id = $1
            AND user_id = $2
            `,
            [
                guild.id,
                userId
            ]
        );

        const count = result.rows[0].count;

        if (count >= 1) {
            await awardAchievement({
                guild,
                userId,
                key: "first_ticket",
                name: "First Ticket",
                description:
                    "You opened your first support ticket with Resolve.",
                emoji: "🎫"
            });
        }

        if (count >= 5) {
            await awardAchievement({
                guild,
                userId,
                key: "regular_customer",
                name: "Regular Customer",
                description:
                    "You opened 5 support tickets.",
                emoji: "🔵"
            });
        }

        if (count >= 25) {
            await awardAchievement({
                guild,
                userId,
                key: "support_veteran",
                name: "Support Veteran",
                description:
                    "You opened 25 support tickets.",
                emoji: "🏆"
            });
        }

        if (count >= 100) {
            await awardAchievement({
                guild,
                userId,
                key: "support_legend",
                name: "Support Legend",
                description:
                    "You opened 100 support tickets.",
                emoji: "⭐"
            });
        }

        await checkAchievementMilestones(
            guild,
            userId
        );

    } catch (error) {
        console.error(
            "❌ Ticket achievement error:",
            error
        );
    }
}

// ==========================================
// CHECK COMMUNITY MESSAGE ACHIEVEMENTS
// ==========================================

async function checkMessageAchievements(
    guild,
    userId
) {
    if (!guild || guild.id !== SUPPORT_SERVER_ID) {
        return;
    }

    try {
        const result = await db.query(
            `
            CREATE TABLE IF NOT EXISTS achievement_activity (
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                activity_type TEXT NOT NULL,
                activity_count INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (
                    guild_id,
                    user_id,
                    activity_type
                )
            )
            `
        );

        await db.query(
            `
            INSERT INTO achievement_activity (
                guild_id,
                user_id,
                activity_type,
                activity_count
            )
            VALUES ($1, $2, 'messages', 1)
            ON CONFLICT (
                guild_id,
                user_id,
                activity_type
            )
            DO UPDATE SET
                activity_count =
                    achievement_activity.activity_count + 1
            `,
            [
                guild.id,
                userId
            ]
        );

        const countResult = await db.query(
            `
            SELECT activity_count
            FROM achievement_activity
            WHERE guild_id = $1
            AND user_id = $2
            AND activity_type = 'messages'
            `,
            [
                guild.id,
                userId
            ]
        );

        const count =
            countResult.rows[0]?.activity_count || 0;

        if (count >= 1) {
            await awardAchievement({
                guild,
                userId,
                key: "first_message",
                name: "First Message",
                description:
                    "You sent your first community message.",
                emoji: "💬"
            });
        }

        if (count >= 25) {
            await awardAchievement({
                guild,
                userId,
                key: "conversation_starter",
                name: "Conversation Starter",
                description:
                    "You sent 25 community messages.",
                emoji: "🗣️"
            });
        }

        if (count >= 100) {
            await awardAchievement({
                guild,
                userId,
                key: "community_voice",
                name: "Community Voice",
                description:
                    "You sent 100 community messages.",
                emoji: "📣"
            });
        }

        if (count >= 500) {
            await awardAchievement({
                guild,
                userId,
                key: "community_regular",
                name: "Community Regular",
                description:
                    "You sent 500 community messages.",
                emoji: "🌐"
            });
        }

    } catch (error) {
        console.error(
            "❌ Message achievement error:",
            error
        );
    }
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    awardAchievement,
    getUserAchievements,
    getAchievementCount,
    checkAchievementMilestones,
    checkTicketAchievements,
    checkMessageAchievements,
    ACHIEVEMENTS,
    ACHIEVEMENT_ROLES
};