import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";
import { postLoserboard } from "../misc/leaderboards";

export const LoserboardCmd = async (interaction: ChatInputCommandInteraction) => {
  await interaction.deferReply();
  const { options } = interaction;

  const page = options.getNumber('page') ?? 1;
  const content = await postLoserboard(interaction.guildId!, page);
  const embed = new EmbedBuilder()
    .setTitle(`Loserboard${page !== 1 ? ' (Page ' + page + ')' : ''}`)
    .setDescription(content)
    .setColor(0xd797ff);

  await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
  return;
}