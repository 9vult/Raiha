import { EmbedBuilder, Message } from "discord.js"
import { expireText, hintText } from "../misc/misc";
import { leaderboards } from '../raiha';

const EXPIRE_TIME = 60;
export default async function informNewUser(originalMessage: Message<true>) {
  const { author: { id: op }, guild: { id: server } } = originalMessage;
  const { Raiha, Configuration } = leaderboards;
  const serverGreenThreshold = Configuration[server].greenThreshold ?? 0;

  if (!Raiha[server]?.[op] || Raiha[server][op] <= serverGreenThreshold) {
    const embed = new EmbedBuilder()
      .setTitle("Alt Text Help")
      .setDescription(hintText + expireText(EXPIRE_TIME))
      .setColor(0xf4d7ff);

    await originalMessage.reply({ embeds: [embed] })
      .then(reply => setTimeout(() => reply.delete(), EXPIRE_TIME * 1000));
  }
}
