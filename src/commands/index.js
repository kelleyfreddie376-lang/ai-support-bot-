const fs = require("fs");
const path = require("path");

const commands = [];

const commandsPath = __dirname;

const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith(".js") && file !== "index.js");

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));

    if ("data" in command && "execute" in command) {
        commands.push(command);
    } else {
        console.warn(`⚠️ Command ${file} is missing "data" or "execute".`);
    }
}

module.exports = commands;