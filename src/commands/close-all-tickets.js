const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require("discord.js");

const db = require("../database/db");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("close-all-tickets")
        .setDescription("Emergency close all active support tickets")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // ==========================================
        // OWNER ONLY
        // ==========================================

        const ownerId = process.env.BOT_OWNER_ID;

        if (!ownerId) {
            return interaction.reply({
                content:
                    "❌ BOT_OWNER_ID is not configured.",
                ephemeral: true
            });
        }

        if (interaction.user.id !== ownerId) {
            return interaction.reply({
                content:
                    "❌ Only the bot owner can use this command.",
                ephemeral: true
            });
        }

        await interaction.deferReply({
            ephemeral: true
        });

        try {
            // ==========================================
            // FIND ACTIVE TICKETS
            // ==========================================

            const ticketsResult = await db.query(
                `
                SELECT
                    id,
                    channel_id,
                    user_id
                FROM tickets
                WHERE guild_id = $1
                AND status IN ('open', 'human')
                `,
                [interaction.guild.id]
            );

            const tickets = ticketsResult.rows;

            if (tickets.length === 0) {
                return interaction.editReply({
                    content:
                        "ℹ️ There are no active tickets in this server."
                });
            }

            let closedCount = 0;
            let failedCount = 0;

            // ==========================================
            // CLOSE EVERY ACTIVE TICKET
            // ==========================================

            for (const ticket of tickets) {
                try {
                    await db.query(
                        `
                        UPDATE tickets
                        SET status = 'closed',
                            closed_at = NOW()
                        WHERE id = $1
                        AND status IN ('open', 'human')
                        `,
                        [ticket.id]
                    );

                    const channel =
                        interaction.guild.channels.cache.get(
                            ticket.channel_id
                        );

                    if (channel) {
                        // Hide ticket from the ticket owner.
                        try {
                            await channel.permissionOverwrites.edit(
                                ticket.user_id,
                                {
                                    ViewChannel: false
                                }
                            );
                        } catch (error) {
                            console.log(
                                `⚠️ Could not hide ticket ${ticket.id} from user.`
                            );
                        }

                        // Remove ticket buttons.
                        try {
                            const messages =
                                await channel.messages.fetch({
                                    limit: 10
                                });

                            for (const message of messages.values()) {
                                if (message.components.length > 0) {
                                    await message.edit({
                                        components: []
                                    }).catch(() => {});
                                }
                            }
                        } catch (error) {
                            console.log(
                                `⚠️ Could not remove buttons from ticket ${ticket.id}.`
                            );
                        }

                        // Add emergency closure notice.
                        try {
                            await channel.send({
                                content:
                                    "🔒 **Emergency Closure**\n\n" +
                                    "This ticket was closed by the bot owner as part of an emergency ticket shutdown."
                            });
                        } catch (error) {
                            console.log(
                                `⚠️ Could not send closure message to ticket ${ticket.id}.`
                            );
                        }
                    }

                    closedCount++;

                } catch (error) {
                    failedCount++;

                    console.error(
                        `❌ Failed to close ticket ${ticket.id}:`,
                        error
                    );
                }
            }

            // ==========================================
            // RESULT
            // ==========================================

            console.log(
                `🚨 Emergency ticket shutdown by ${interaction.user.tag}: ${closedCount} closed, ${failedCount} failed.`
            );

            await interaction.editReply({
                content:
                    "🚨 **Emergency Ticket Shutdown Complete**\n\n" +
                    `🔒 Tickets closed: **${closedCount}**\n` +
                    `❌ Failed: **${failedCount}**`
            });

        } catch (error) {
            console.error(
                "❌ Emergency ticket shutdown error:",
                error
            );

            await interaction.editReply({
                content:
                    "❌ Something went wrong while closing the active tickets."
            });
        }
    }
};