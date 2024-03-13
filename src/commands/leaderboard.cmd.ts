import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";
import { postLeaderboard } from "../misc/leaderboards";

export const LeaderboardCmd = async (interaction: ChatInputCommandInteraction) => {
  await interaction.deferReply();
  const { options } = interaction;

  const page = options.getNumber('page') ?? 1;

  const content = postLeaderboard(interaction.guildId!, page);
  const embed = new EmbedBuilder()
    .setTitle(`Alt Text Leaderboards${page !== 1 ? ' (Page ' + page + ')' : ''}`)
    .setDescription(content.text)
    .setFooter({ text: content.footer })
    .setColor(0xd797ff);

  await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
  return;
}