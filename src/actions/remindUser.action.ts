import { EmbedBuilder, Message } from "discord.js"
import { expiry, reminderText } from "../misc/misc";
import { leaderboards } from '../raiha';

export async function remindUser(originalMessage: Message<boolean>) {
  const expireTime = 15;
  if (!leaderboards.UserSettings?.[originalMessage.author.id]?.Reminder) return;
  const embed = new EmbedBuilder()
    .setTitle("Alt Text Help")
    .setDescription(expiry(reminderText, expireTime))
    .setColor(0xf4d7ff);

  await originalMessage.reply({ embeds: [embed] })
    .then(theReply => {
      setTimeout(() => theReply.delete(), expireTime * 1000);
    });
}
