const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const db = require("../database/database");

const COOLDOWN = 60 * 60 * 1000; // 1 hour

const jobs = [
    "💻 You fixed a computer",
    "🛠️ You helped someone with a project",
    "🎮 You tested a new game",
    "📦 You delivered some packages",
    "🧹 You cleaned up a workspace",
    "🔧 You repaired something",
    "📚 You helped someone study",
    "☕ You worked a shift at the café"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("work")
        .setDescription("Work to earn some coins."),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const now = Date.now();

        let user = db.prepare(`
            SELECT coins, last_work
            FROM user_rewards
            WHERE guild_id = ? AND user_id = ?
        `).get(guildId, userId);

        if (!user) {
            db.prepare(`
                ALTER TABLE user_rewards
                ADD COLUMN last_work INTEGER DEFAULT 0
            `).run();

            db.prepare(`
                INSERT INTO user_rewards
                (guild_id, user_id, coins, last_daily, last_work)
                VALUES (?, ?, 0, 0, 0)
            `).run(guildId, userId);

            user = {
                coins: 0,
                last_work: 0
            };
        }

        const timeRemaining =
            COOLDOWN - (now - (user.last_work || 0));

        if (timeRemaining > 0) {
            const minutes = Math.ceil(
                timeRemaining / (60 * 1000)
            );

            return interaction.reply({
                content:
                    `⏰ You're too tired to work again!\n` +
                    `Come back in **${minutes} minutes**.`,
                ephemeral: true
            });
        }

        const reward =
            Math.floor(Math.random() * 501) + 250;

        const job =
            jobs[Math.floor(Math.random() * jobs.length)];

        const newBalance =
            user.coins + reward;

        db.prepare(`
            UPDATE user_rewards
            SET coins = ?, last_work = ?
            WHERE guild_id = ? AND user_id = ?
        `).run(
            newBalance,
            now,
            guildId,
            userId
        );

        const embed = new EmbedBuilder()
            .setColor(0x22c55e)
            .setTitle("💼 Work Complete")
            .setDescription(
                `${job}.\n\n` +
                `💰 You earned **${reward.toLocaleString()} coins**!\n` +
                `🪙 New balance: **${newBalance.toLocaleString()} coins**`
            )
            .setFooter({
                text: "GameLog Economy • Work again in 1 hour"
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};