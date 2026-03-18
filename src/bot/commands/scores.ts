import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import * as karmaData from "../../data/karma.js";

export const data = new SlashCommandBuilder()
  .setName("scores")
  .setDescription("Show the current karma leaderboard");

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const scores = karmaData.getScores();

  if (scores.length === 0) {
    await interaction.reply("No karma recorded yet.");
    return;
  }

  const lines = scores.map((s) => `${s.medal || "  "} **${s.name}** — ${s.karma}`);

  const embed = new EmbedBuilder()
    .setTitle("🐱 Karma Leaderboard")
    .setDescription(lines.join("\n"))
    .setColor(0xffd700);

  await interaction.reply({ embeds: [embed] });
}
