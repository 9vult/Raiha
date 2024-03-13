import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";
import { postRank } from "../misc/leaderboards";

export const RankCmd = async (interaction: ChatInputCommandInteraction) => {
  await interaction.deferReply();
  const { options, user } = interaction;
  const specifiedUser = options.getUser('user') || user;
  const id = specifiedUser.id;
  const content = postRank(id, interaction.guildId!);
  const embed = new EmbedBuilder()
    .setTitle(`Alt Text Leaderboards`)
    .setDescription(content)
    .setColor(0xd797ff);

  await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
  return;
}