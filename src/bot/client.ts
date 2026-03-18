import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Events,
  ChatInputCommandInteraction,
} from "discord.js";
import * as karmaCommand from "./commands/karma.js";
import * as scoresCommand from "./commands/scores.js";

// Commands registry — add new commands here as you build them out.
const commands = [karmaCommand, scoresCommand];

export function createBot(token: string): Client {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, async (c) => {
    console.log(`Logged in as ${c.user.tag}`);

    const guildId = process.env.DISCORD_GUILD_ID;
    await registerCommands(token, c.user.id, guildId);

    await c.user.setActivity("/help for commands");
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
      await handleCommand(interaction);
    }
  });

  return client;
}

async function registerCommands(
  token: string,
  clientId: string,
  guildId?: string
): Promise<void> {
  const rest = new REST().setToken(token);
  const body = commands.map((cmd) => cmd.data.toJSON());

  const route = guildId
    ? Routes.applicationGuildCommands(clientId, guildId)
    : Routes.applicationCommands(clientId);

  await rest.put(route, { body });
  console.log(
    `Registered ${body.length} slash command(s) ${guildId ? `to guild ${guildId}` : "globally"}.`
  );
}

async function handleCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const cmd = commands.find(
    (c) => c.data.name === interaction.commandName
  );
  if (!cmd) return;
  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error("Command error:", err);
    const msg = { content: "Something went wrong.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
}
