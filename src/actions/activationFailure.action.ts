import { EmbedBuilder, Message } from "discord.js"
import { expiry, reminderText } from "../misc/misc";
import { leaderboards } from '../raiha';

export async function activationFailure(originalMessage: Message<boolean>) {
  // const expireTime = 30;
  if (!leaderboards.UserSettings?.[originalMessage.author.id]?.ActivationFailure) return;
  await originalMessage.reply("https://imgur.com/NTw02QA");
    // .then(theReply => {
    //   setTimeout(() => theReply.delete(), expireTime * 1000);
    // });
}
