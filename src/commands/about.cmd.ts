import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";
import { VERSION } from "../raiha";

export const AboutCmd = async (interaction: ChatInputCommandInteraction) => {
  const embed = new EmbedBuilder()
    .setTitle(`Raiha Accessibility Bot`)
    .setDescription(`Version: ${VERSION}\nAuthor: <@248600185423396866>`)
    .setURL(`https://github.com/9vult/Raiha`)
    .setColor(0xd797ff);
  await interaction.reply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
  return;
}