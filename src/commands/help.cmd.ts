import { ActionRowBuilder, ChatInputCommandInteraction, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction } from "discord.js";
import { HelpEmbedMap, HelpSelections } from "../misc/help";

export const HelpCmd = async (interaction: ChatInputCommandInteraction) => {
  const row = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(HelpSelections);

  const response = await interaction.reply({
    content: "Please make a selection:",
    components: [row],
  });

  try {
    const confirmation = await response.awaitMessageComponent({ time: 60_000 }) as StringSelectMenuInteraction;
    const selection: string = confirmation.values[0] ?? 'error';
    await confirmation.update({ content: "", embeds: [HelpEmbedMap[selection]], components: [] })
  } catch (e) {
    await interaction.deleteReply();
  }
}