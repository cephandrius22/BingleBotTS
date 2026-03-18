import {
  SlashCommandBuilder,
  SlashCommandStringOption,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import * as karmaData from "../../data/karma.js";

// /karma give <cat> <amount> [reason]
// /karma take <cat> <amount> [reason]
// /karma scores
// /karma history <cat>

const CAT_CHOICES = [
  { name: "Ramona", value: "ramona" },
  { name: "Midnight", value: "midnight" },
  { name: "Steris", value: "steris" },
] as const;

function catOption(opt: SlashCommandStringOption): SlashCommandStringOption {
  return opt
    .setName("cat")
    .setDescription("Cat name")
    .setRequired(true)
    .addChoices(...CAT_CHOICES);
}

export const data = new SlashCommandBuilder()
  .setName("karma")
  .setDescription("Manage cat karma")
  .addSubcommand((sub) =>
    sub
      .setName("give")
      .setDescription("Give karma to a cat")
      .addStringOption(catOption)
      .addIntegerOption((opt) =>
        opt
          .setName("amount")
          .setDescription("Amount (1, 5, or 10)")
          .setRequired(true)
          .addChoices(
            { name: "1", value: 1 },
            { name: "5", value: 5 },
            { name: "10", value: 10 }
          )
      )
      .addStringOption((opt) =>
        opt.setName("reason").setDescription("Reason").setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("take")
      .setDescription("Take karma from a cat")
      .addStringOption(catOption)
      .addIntegerOption((opt) =>
        opt
          .setName("amount")
          .setDescription("Amount (1, 5, or 10)")
          .setRequired(true)
          .addChoices(
            { name: "1", value: 1 },
            { name: "5", value: 5 },
            { name: "10", value: 10 }
          )
      )
      .addStringOption((opt) =>
        opt.setName("reason").setDescription("Reason").setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("scores").setDescription("Show the karma leaderboard")
  )
  .addSubcommand((sub) =>
    sub
      .setName("history")
      .setDescription("Show karma history for a cat")
      .addStringOption(catOption)
  );

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const sub = interaction.options.getSubcommand();

  if (sub === "give" || sub === "take") {
    const cat = interaction.options.getString("cat", true);
    const amount = interaction.options.getInteger("amount", true);
    const reason = interaction.options.getString("reason") ?? undefined;
    const delta = sub === "give" ? amount : -amount;

    const newTotal = karmaData.applyDelta(cat, delta, reason);
    const sign = delta > 0 ? "+" : "";
    const action = delta > 0 ? "gave" : "took";
    const prep = delta > 0 ? "to" : "from";

    await interaction.reply(
      `${sign}${delta} karma ${action} ${prep} **${cat}** ` +
        `(now ${newTotal})` +
        (reason ? ` — *${reason}*` : "")
    );
    return;
  }

  if (sub === "scores") {
    const scores = karmaData.getScores();
    if (scores.length === 0) {
      await interaction.reply("No karma recorded yet.");
      return;
    }

    const lines = scores.map(
      (s) => `${s.medal || "  "} **${s.name}** — ${s.karma}`
    );

    const embed = new EmbedBuilder()
      .setTitle("🐱 Karma Leaderboard")
      .setDescription(lines.join("\n"))
      .setColor(0xffd700);

    await interaction.reply({ embeds: [embed] });
    return;
  }

  if (sub === "history") {
    const cat = interaction.options.getString("cat", true);
    const { entries, currentKarma } = karmaData.getHistory(cat);

    if (entries.length === 0) {
      await interaction.reply(`No history found for **${cat}**.`);
      return;
    }

    const lines = entries.map((e) => {
      const sign = e.delta > 0 ? "+" : "";
      const note = e.reason ? ` — *${e.reason}*` : "";
      return `\`${e.timestamp}\` ${sign}${e.delta}${note}`;
    });

    const embed = new EmbedBuilder()
      .setTitle(`📜 Karma history for ${cat} (current: ${currentKarma})`)
      .setDescription(lines.join("\n"))
      .setColor(0x7289da);

    await interaction.reply({ embeds: [embed] });
    return;
  }
}
