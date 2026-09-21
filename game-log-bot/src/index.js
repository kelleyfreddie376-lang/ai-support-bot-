require("dotenv").config();

const {
    Client,
    Collection,
    GatewayIntentBits,
    Partials,
    ActivityType
} = require("discord.js");

const fs = require("fs");
const path = require("path");

require("./database/database");

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

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");

function loadCommands(directory) {
    if (!fs.existsSync(directory)) return;

    const files = fs.readdirSync(directory);

    for (const file of files) {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            loadCommands(filePath);
            continue;
        }

        if (!file.endsWith(".js")) continue;

        const command = require(filePath);

        if ("data" in command && "execute" in command) {
            client.commands.set(
                command.data.name,
                command
            );

            console.log(`📥 Loaded command: /${command.data.name}`);
        }
    }
}

loadCommands(commandsPath);

client.once("clientReady", () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
    console.log(`🌐 Serving ${client.guilds.cache.size} server(s).`);
    console.log(`🎮 Loaded ${client.commands.size} command(s).`);

    updateStatus();

    setInterval(() => {
        updateStatus();
    }, 10_000);
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(
        interaction.commandName
    );

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(
            `❌ Error running /${interaction.commandName}:`,
            error
        );

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "❌ Something went wrong while running that command.",
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: "❌ Something went wrong while running that command.",
                ephemeral: true
            });
        }
    }
});

client.on("error", error => {
    console.error("❌ Discord client error:", error);
});

process.on("unhandledRejection", error => {
    console.error("❌ Unhandled promise rejection:", error);
});

const statuses = [
    {
        type: ActivityType.Playing,
        text: "/games"
    },
    {
        type: ActivityType.Watching,
        text: "TGN"
    },
    {
        type: ActivityType.Playing,
        text: "🎲 Discord Games"
    },
    {
        type: ActivityType.Watching,
        text: "server logs"
    }
];

let statusIndex = 0;

function updateStatus() {
    const status = statuses[statusIndex];

    client.user.setActivity(status.text, {
        type: status.type
    });

    console.log(`🔄 Status updated: ${status.text}`);

    statusIndex++;

    if (statusIndex >= statuses.length) {
        statusIndex = 0;
    }
}

client.login(process.env.DISCORD_TOKEN);