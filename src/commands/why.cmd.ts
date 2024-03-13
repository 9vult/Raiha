import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { whyText } from "../misc/misc";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";

export const WhyCmd = async (interaction: ChatInputCommandInteraction) => {
  const embed = new EmbedBuilder()
    .setTitle(`Why Use Alt Text?`)
    .setDescription(whyText)
    .setURL(`https://moz.com/learn/seo/alt-text`)
    .setColor(0xd797ff);

  await interaction.reply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
  return;
}