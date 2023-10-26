import { EmbedBuilder, Message } from "discord.js"
import { hintText } from "../misc/misc";

export const informNewUser = async (originalMessage: Message<boolean>, leaderboards: {[key:string]:any}) => {
  let op = originalMessage.author.id;
  let server = originalMessage.guild!.id;
  let config = leaderboards['Configuration'];
  let serverGreenThreshold: number = config[server]['greenThreshold'] || 0;

  if (!leaderboards['Raiha'] || 
      leaderboards['Raiha'][originalMessage.guild!.id][op] == undefined || 
      leaderboards['Raiha'][server][op] <= serverGreenThreshold
  ) {
    const embed = new EmbedBuilder()
      .setTitle("Alt Text Help")
      .setDescription(hintText)
      .setColor(0xf4d7ff);
    
    await originalMessage.reply({ embeds: [embed] })
            .then(theReply => {
              setTimeout(() => theReply.delete(), 60000);
            });
  }
}