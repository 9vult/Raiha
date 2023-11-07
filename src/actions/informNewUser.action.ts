import { EmbedBuilder, Message } from "discord.js"
import { hintText } from "../misc/misc";
import { leaderboards } from '../raiha';

export async function informNewUser(originalMessage: Message<true>) {
  const { author: { id: op }, guild: { id: server } } = originalMessage;
  const { Raiha, Configuration } = leaderboards;
  const serverGreenThreshold = Configuration[server].greenThreshold ?? 0;

  if (!Raiha[server]?.[op] || Raiha[server][op] <= serverGreenThreshold) {
    const embed = new EmbedBuilder()
      .setTitle("Alt Text Help")
      .setDescription(hintText)
      .setColor(0xf4d7ff);

    await originalMessage.reply({ embeds: [embed] })
      .then(reply => setTimeout(() => reply.delete(), 60000));
  }
}