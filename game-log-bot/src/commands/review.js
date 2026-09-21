const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const REVIEW_CHANNEL_ID = "1548148392688099408";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("review")
        .setDescription("Leave a review for a TGN staff member.")
        .addUserOption(option =>
            option
                .setName("staff")
                .setDescription("The TGN staff member you want to review.")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("rating")
                .setDescription("Rate the staff member from 1 to 5 stars.")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(5)
        )
        .addStringOption(option =>
            option
                .setName("review")
                .setDescription("Write your review.")
                .setRequired(true)
                .setMaxLength(1000)
        ),

    async execute(interaction) {
        const staff = interaction.options.getUser("staff");
        const rating = interaction.options.getInteger("rating");
        const review = interaction.options.getString("review");

        const reviewChannel = interaction.guild.channels.cache.get(
            REVIEW_CHANNEL_ID
        );

        if (!reviewChannel) {
            return interaction.reply({
                content:
                    "❌ I couldn't find the configured review channel.",
                ephemeral: true
            });
        }

        if (!reviewChannel.isTextBased()) {
            return interaction.reply({
                content:
                    "❌ The configured review channel isn't a text channel.",
                ephemeral: true
            });
        }

        const stars =
            "⭐".repeat(rating) +
            "☆".repeat(5 - rating);

        const embed = new EmbedBuilder()
            .setColor(0x7c3aed)
            .setTitle("🎯 New Staff Review")
            .addFields(
                {
                    name: "👤 Staff Member",
                    value: `${staff}`,
                    inline: true
                },
                {
                    name: "⭐ Rating",
                    value: `${stars} **${rating}/5**`,
                    inline: true
                },
                {
                    name: "💬 Review",
                    value: review
                },
                {
                    name: "📝 Submitted By",
                    value: `${interaction.user}`
                }
            )
            .setThumbnail(
                staff.displayAvatarURL({
                    size: 256
                })
            )
            .setFooter({
                text: "TGN • Staff Reviews"
            })
            .setTimestamp();

        await reviewChannel.send({
            embeds: [embed]
        });

        await interaction.reply({
            content:
                `✅ Your review for ${staff} has been posted in ${reviewChannel}!`,
            ephemeral: true
        });
    }
};