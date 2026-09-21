const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setup-economy")
        .setDescription("Set up the GameLog economy channels and announcement.")
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageChannels
        ),

    async execute(interaction) {
        const guild = interaction.guild;

        await interaction.deferReply({
            ephemeral: true
        });

        try {
            // Find or create the GameLog Economy category
            let category = guild.channels.cache.find(
                channel =>
                    channel.type === ChannelType.GuildCategory &&
                    channel.name === "💰 GAMELOG ECONOMY"
            );

            if (!category) {
                category = await guild.channels.create({
                    name: "💰 GAMELOG ECONOMY",
                    type: ChannelType.GuildCategory
                });
            }

            // Helper function to find or create channels
            async function getOrCreateChannel(name, topic) {
                let channel = guild.channels.cache.find(
                    existing =>
                        existing.type === ChannelType.GuildText &&
                        existing.name === name &&
                        existing.parentId === category.id
                );

                if (!channel) {
                    channel = await guild.channels.create({
                        name,
                        type: ChannelType.GuildText,
                        parent: category.id,
                        topic
                    });
                }

                return channel;
            }

            const announcementChannel = await getOrCreateChannel(
                "📢・economy-announcements",
                "Official GameLog Economy announcements."
            );

            const economyChannel = await getOrCreateChannel(
                "💰・economy",
                "Use GameLog economy commands here."
            );

            const leaderboardChannel = await getOrCreateChannel(
                "🏆・leaderboard",
                "GameLog Economy leaderboard."
            );

            const gamesChannel = await getOrCreateChannel(
                "🎮・economy-games",
                "Play GameLog virtual coin games here."
            );

            // Economy announcement
            const announcementEmbed = new EmbedBuilder()
                .setColor(0x7c3aed)
                .setTitle("💰 GameLog Economy Is Here!")
                .setDescription(
                    "Welcome to the **GameLog Economy**!\n\n" +
                    "Earn virtual coins, build your balance, compete on the leaderboard, " +
                    "and play GameLog's economy games.\n\n" +
                    "🪙 **All coins are virtual and have no real-world value.**"
                )
                .addFields(
                    {
                        name: "🎁 Daily Rewards",
                        value:
                            "`/daily` — Claim your daily coin reward.",
                        inline: true
                    },
                    {
                        name: "💰 Balance",
                        value:
                            "`/balance` — Check how many coins you have.",
                        inline: true
                    },
                    {
                        name: "💼 Work",
                        value:
                            "`/work` — Work and earn more coins.",
                        inline: true
                    },
                    {
                        name: "💸 Pay",
                        value:
                            "`/pay` — Send virtual coins to another player.",
                        inline: true
                    },
                    {
                        name: "🏆 Leaderboard",
                        value:
                            "`/leaderboard` — See the top players.",
                        inline: true
                    },
                    {
                        name: "🪙 Coin Flip",
                        value:
                            "`/coinflip` — Bet virtual coins on a coin flip.",
                        inline: true
                    },
                    {
                        name: "🎲 Dice",
                        value:
                            "`/dice` — Roll the dice for virtual coins.",
                        inline: true
                    },
                    {
                        name: "✊ Rock Paper Scissors",
                        value:
                            "`/rps` — Challenge GameLog to RPS.",
                        inline: true
                    },
                    {
                        name: "🎰 Slots",
                        value:
                            "`/slots` — Try the virtual slot machine.",
                        inline: true
                    }
                )
                .addFields({
                    name: "📍 Where To Use Them",
                    value:
                        `💰 ${economyChannel}\n` +
                        `🎮 ${gamesChannel}\n` +
                        `🏆 ${leaderboardChannel}`,
                    inline: false
                })
                .setFooter({
                    text: "GameLog Economy • MADE BY FREDDIE"
                })
                .setTimestamp();

            // Check whether an announcement already exists
            const recentMessages =
                await announcementChannel.messages.fetch({
                    limit: 50
                });

            const alreadyAnnounced = recentMessages.some(
                message =>
                    message.author.id === interaction.client.user.id &&
                    message.embeds.some(
                        embed =>
                            embed.title === "💰 GameLog Economy Is Here!"
                    )
            );

            if (!alreadyAnnounced) {
                await announcementChannel.send({
                    embeds: [announcementEmbed]
                });
            }

            // Send a setup confirmation
            await interaction.editReply({
                content:
                    "✅ **GameLog Economy setup complete!**\n\n" +
                    `📁 Category: ${category}\n` +
                    `📢 Announcements: ${announcementChannel}\n` +
                    `💰 Economy: ${economyChannel}\n` +
                    `🏆 Leaderboard: ${leaderboardChannel}\n` +
                    `🎮 Games: ${gamesChannel}`
            });

        } catch (error) {
            console.error("❌ Economy setup failed:", error);

            await interaction.editReply({
                content:
                    "❌ I couldn't finish setting up the economy channels.\n\n" +
                    "Make sure GameLog has **Manage Channels** permission."
            });
        }
    }
};