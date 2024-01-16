import { EmbedBuilder, Message } from "discord.js"
import { expiry, autoModeOptOutHint } from "../misc/misc";
import { leaderboards } from '../raiha';

export async function informNewAutoModeOptOut(originalMessage: Message<true>) {
  const expireTime = 45;
  const { author: { id: op }, guild: { id: server } } = originalMessage;
  const { Raiha, Configuration } = leaderboards;
  const serverAutoModeOptOut = Configuration[server].autoModeOptOut ?? false;
  const green = Configuration[server].greenThreshold ?? 1;

  if (serverAutoModeOptOut && (!Raiha[server]?.[op] || Raiha[server][op] <= green)) {
    const embed = new EmbedBuilder()
      .setTitle("Alt Text Help")
      .setDescription(expiry(autoModeOptOutHint, expireTime))
      .setColor(0xf4d7ff);

    await originalMessage.reply({ embeds: [embed] })
      .then(reply => setTimeout(() => reply.delete(), expireTime * 1000));
  }
}
