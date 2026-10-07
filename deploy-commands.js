// Registriert die Slash-Commands beim Discord-Server (nur einmal nötig,
// bzw. erneut ausführen, wenn sich die Befehle ändern).
require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("bestellung")
    .setDescription("Neue Ausrüstungsbestellung aufgeben")
    .toJSON(),
  new SlashCommandBuilder()
    .setName("bestellungen")
    .setDescription("Offene Bestellungen anzeigen")
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    if (!process.env.CLIENT_ID || !process.env.GUILD_ID) {
      console.error("CLIENT_ID und GUILD_ID müssen in der .env gesetzt sein.");
      process.exit(1);
    }

    console.log("Registriere Slash-Commands...");

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log("Slash-Commands erfolgreich registriert.");
  } catch (error) {
    console.error(error);
  }
})();
