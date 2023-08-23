import { EmbedBuilder, Message } from "discord.js"
import { hintText } from "../misc/misc";

export const informNewUser = async (originalMessage: Message<boolean>, leaderboards: {[key:string]:any}) => {
  let op = originalMessage.author.id;
  if (!(op in leaderboards['Raiha']) || leaderboards['Raiha'][op] == 0) {
    const embed = new EmbedBuilder()
      .setTitle("Hey there!")
      .setDescription(hintText)
      .setColor(0xf4d7ff);
    
    await originalMessage.reply({ embeds: [embed] })
            .then(theReply => {
              setTimeout(() => theReply.delete(), 45000);
            });
  }
}