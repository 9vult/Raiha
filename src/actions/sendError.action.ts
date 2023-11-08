import { EmbedBuilder } from "discord.js";
import { CLIENT, leaderboards } from "../raiha";

export default async function sendError(guildId: string, errorTitle: string, errorBody: string, authorId: string | number, url: string) {
  let chan = leaderboards.Configuration[guildId].errorChannel;
  const embed = new EmbedBuilder()
    .setTitle(`Error: ${errorTitle}`)
    .setDescription(`${errorBody}\nAuthor ${authorId}\nURL ${url}`)
    .setColor(0xf4d7ff);
  const channel = CLIENT.channels.cache.get(chan)
  if (!channel?.isTextBased()) return;
  await channel.send({ embeds: [embed] })
}