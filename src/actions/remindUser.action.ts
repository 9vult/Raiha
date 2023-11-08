import { EmbedBuilder, Message } from "discord.js"
import { expireText, reminderText } from "../misc/misc";
import { leaderboards } from '../raiha';

const EXPIRE_TIME = 15;
export default async function remindUser(originalMessage: Message<boolean>) {
  if (!leaderboards.UserSettings?.[originalMessage.author.id]?.Reminder) return;
  const embed = new EmbedBuilder()
    .setTitle("Alt Text Help")
    .setDescription(reminderText + expireText(EXPIRE_TIME))
    .setColor(0xf4d7ff);

  await originalMessage.reply({ embeds: [embed] })
    .then(reply => setTimeout(() => reply.delete(), EXPIRE_TIME * 1000));
}
