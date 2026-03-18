import "dotenv/config";
import { initDb } from "./data/karma.js";
import { createBot } from "./bot/client.js";
import { startServer } from "./web/server.js";

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("DISCORD_TOKEN is not set. Add it to your .env file.");
  process.exit(1);
}

// Initialize the database (creates tables if they don't exist).
initDb();

// Start the web server.
startServer(8080);

// Start the Discord bot.
const bot = createBot(token);
bot.login(token);
