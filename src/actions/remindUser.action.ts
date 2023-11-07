import { EmbedBuilder, Message } from "discord.js"
import { reminderText } from "../misc/misc";
import { leaderboards } from '../raiha';

export async function remindUser(originalMessage: Message<boolean>) {
  if (!leaderboards.UserSettings?.[originalMessage.author.id]?.Reminder) return;
  const embed = new EmbedBuilder()
    .setTitle("Alt Text Help")
    .setDescription(reminderText)
    .setColor(0xf4d7ff);

  await originalMessage.reply({ embeds: [embed] })
    .then(theReply => {
      setTimeout(() => theReply.delete(), 15000);
    });
}