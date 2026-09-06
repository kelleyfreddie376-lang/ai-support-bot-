require("dotenv").config();

const { REST, Routes } = require("discord.js");
const commands = require("./commands");

if (!process.env.DISCORD_TOKEN) {
    console.error("❌ DISCORD_TOKEN is missing from .env");
    process.exit(1);
}

if (!process.env.CLIENT_ID) {
    console.error("❌ CLIENT_ID is missing from .env");
    process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

async function deployCommands() {
    try {
        console.log(`🔄 Registering ${commands.length} command(s)...`);

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            {
                body: commands.map(command => command.data.toJSON())
            }
        );

        console.log("✅ Commands registered successfully!");
    } catch (error) {
        console.error("❌ Failed to register commands:", error);
    }
}

deployCommands();