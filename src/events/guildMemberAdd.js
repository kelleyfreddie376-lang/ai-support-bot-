const {
    EmbedBuilder
} = require("discord.js");

const {
    awardAchievement
} = require("../services/achievements");

const SUPPORT_SERVER_ID = "1545866787059671100";

module.exports = {
    name: "guildMemberAdd",

    async execute(member) {
        try {
            // Only run in the official Resolve Support Server.
            if (member.guild.id !== SUPPORT_SERVER_ID) {
                return;
            }

            // Ignore bots.
            if (member.user.bot) {
                return;
            }

            // ==========================================
            // WELCOME MESSAGE
            // ==========================================

            const welcomeChannel =
                member.guild.channels.cache.find(
                    channel =>
                        channel.name === "👋・welcome" &&
                        channel.isTextBased()
                );

            if (welcomeChannel) {
                const welcomeEmbed = new EmbedBuilder()
                    .setTitle("👋 Welcome to Resolve!")
                    .setDescription(
                        `Welcome <@${member.id}>! We're glad to have you here.\n\n` +
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
                                "Visit the support channels to get help, report an issue, or submit a suggestion.",
                            inline: true
                        },
                        {
                            name: "📚 Learn More",
                            value:
                                "Check out our FAQ, rules, and Resolve information channels to learn more.",
                            inline: true
                        },
                        {
                            name: "🏆 Achievements",
                            value:
                                "Participate in the community, use Resolve, open tickets, and unlock achievements!",
                            inline: false
                        }
                    )
                    .setFooter({
                        text: "Resolve • AI-powered support for Discord"
                    })
                    .setTimestamp();

                await welcomeChannel.send({
                    content: `👋 Welcome to Resolve, <@${member.id}>!`,
                    embeds: [welcomeEmbed]
                });
            }

            // ==========================================
            // WELCOME ACHIEVEMENT
            // ==========================================

            await awardAchievement({
                guild: member.guild,
                userId: member.id,
                key: "welcome",
                name: "Welcome to Resolve",
                description:
                    "You joined the official Resolve Support Server.",
                emoji: "👋"
            });

            // ==========================================
            // EARLY COMMUNITY ACHIEVEMENTS
            // ==========================================

            await awardAchievement({
                guild: member.guild,
                userId: member.id,
                key: "early_adopter",
                name: "Early Adopter",
                description:
                    "You joined Resolve during its early days.",
                emoji: "🚀"
            });

            await awardAchievement({
                guild: member.guild,
                userId: member.id,
                key: "founding_member",
                name: "Founding Member",
                description:
                    "You were one of the early members of the Resolve community.",
                emoji: "💎"
            });

            await awardAchievement({
                guild: member.guild,
                userId: member.id,
                key: "resolve_og",
                name: "Resolve OG",
                description:
                    "You've been part of Resolve since the early days.",
                emoji: "👑"
            });

            console.log(
                `👋 Welcome system completed for ${member.user.tag}`
            );

        } catch (error) {
            console.error(
                "❌ Welcome system error:",
                error
            );
        }
    }
};