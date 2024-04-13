import { EmbedBuilder, Message } from "discord.js"
import { expiry, reminderText } from "../misc/misc";
import { leaderboards } from '../raiha';
import { delmsg } from "./delete.action";

export async function remindUser(originalMessage: Message<true>) {
  const expireTime = 15;
  if (!leaderboards.UserSettings?.[originalMessage.author.id]?.Reminder) return;
  const embed = new EmbedBuilder()
    .setTitle("Alt Text Help")
    .setDescription(expiry(reminderText, expireTime))
    .setColor(0xf4d7ff);

  await originalMessage.reply({ embeds: [embed] })
    .then(theReply => {
      setTimeout(async () => await delmsg(theReply), expireTime * 1000);
    });
}
