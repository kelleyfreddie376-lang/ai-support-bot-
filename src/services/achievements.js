const {
    EmbedBuilder
} = require("discord.js");

const db = require("../database/db");

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

        // Make sure the guild exists in the database.
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

        // Only award an achievement once.
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

        // Already earned.
        if (result.rows.length === 0) {
            return false;
        }

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

        // DM the member.
        try {
            const user = await guild.client.users.fetch(userId);

            await user.send({
                embeds: [achievementEmbed]
            });

            console.log(
                `🏆 Achievement DM sent to ${user.tag}: ${name}`
            );
        } catch (error) {
            console.log(
                `⚠️ Could not DM achievement recipient ${userId}.`
            );
        }

        // Find achievement log channel.
        const achievementChannel = guild.channels.cache.find(
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
                        value: `${emoji} **${name}**`,
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

async function getUserAchievements(guildId, userId) {
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

async function getAchievementCount(guildId, userId) {
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

module.exports = {
    awardAchievement,
    getUserAchievements,
    getAchievementCount
};