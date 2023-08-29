import { EmbedBuilder, Message } from "discord.js"
import { reminderText } from "../misc/misc";

export const remindUser = async (originalMessage: Message<boolean>, leaderboards: {[key:string]:any}) => {
  let op = originalMessage.author.id;
  if (leaderboards['UserSettings'] && leaderboards['UserSettings'][originalMessage.author.id] && leaderboards['UserSettings'][originalMessage.author.id]['Reminder'] == true) {
    const embed = new EmbedBuilder()
      .setTitle("Alt Text Help")
      .setDescription(reminderText)
      .setColor(0xf4d7ff);
    
    await originalMessage.reply({ embeds: [embed] })
            .then(theReply => {
              setTimeout(() => theReply.delete(), 15000);
            });
  }
}