require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Partials
} = require("discord.js");

const { initDatabase } = require("./database/init");
const interactionCreate = require("./events/interactionCreate");
const messageCreate = require("./events/messageCreate");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User
    ]
});

client.once("clientReady", async () => {
    console.log("=================================");
    console.log(`🤖 Logged in as ${client.user.tag}`);
    console.log(`🏠 Servers: ${client.guilds.cache.size}`);

    try {
        await initDatabase();
        console.log("🚀 AI Support Bot is online!");
    } catch (error) {
        console.error("❌ Database initialization failed:", error);
    }

    console.log("=================================");
});

client.on("interactionCreate", async (interaction) => {
    await interactionCreate.execute(interaction);
});

client.on("messageCreate", async (message) => {
    await messageCreate.execute(message);
});

client.on("error", (error) => {
    console.error("❌ Discord client error:", error);
});

if (!process.env.DISCORD_TOKEN) {
    console.error("❌ DISCORD_TOKEN is missing from .env");
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch((error) => {
    console.error("❌ Failed to log in:", error);
});