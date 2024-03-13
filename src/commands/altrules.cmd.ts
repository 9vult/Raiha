import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";
import { leaderboards } from "../raiha";

export const AltRulesCmd = async (interaction: ChatInputCommandInteraction) => {
  let serverValue = leaderboards.Configuration[interaction.guildId!].altrules;
  serverValue = serverValue.replaceAll('\\n', '\n');
  if (serverValue == 'default') serverValue = "This server has not specified any alt text rules.";
  const embed = new EmbedBuilder()
    .setTitle(`Alt Text Rules for '${interaction.guild!.name}'`)
    .setDescription(serverValue)
    .setColor(0xd797ff);

  await interaction.reply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
  return;
}