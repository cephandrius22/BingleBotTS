import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Events,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from "discord.js";
import * as karmaCommand from "./commands/karma.js";

// Commands registry — add new commands here as you build them out.
const commands = [karmaCommand];

export function createBot(token: string): Client {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, async (c) => {
    console.log(`Logged in as ${c.user.tag}`);

    // Register slash commands globally (takes up to an hour to propagate).
    // For faster testing during dev, you can pass a guildId to registerCommands.
    await registerCommands(token, c.user.id);

    await c.user.setActivity("/help for commands");
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isAutocomplete()) {
      await handleAutocomplete(interaction);
    } else if (interaction.isChatInputCommand()) {
      await handleCommand(interaction);
    }
  });

  return client;
}

async function registerCommands(
  token: string,
  clientId: string
): Promise<void> {
  const rest = new REST().setToken(token);
  const body = commands.map((cmd) => cmd.data.toJSON());

  await rest.put(Routes.applicationCommands(clientId), { body });
  console.log(`Registered ${body.length} slash command(s).`);
}

async function handleAutocomplete(
  interaction: AutocompleteInteraction
): Promise<void> {
  const cmd = commands.find(
    (c) => c.data.name === interaction.commandName
  );
  if (!cmd) return;
  try {
    await cmd.autocomplete(interaction);
  } catch (err) {
    console.error("Autocomplete error:", err);
  }
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
