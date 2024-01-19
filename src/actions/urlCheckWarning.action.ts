import { EmbedBuilder, Message } from "discord.js";
import { expiry, urlWarning } from "../misc/misc";
import { generateAllowedMentions } from "./generateAllowedMentions.action";

export async function urlCheckWarning(originalMessage: Message<boolean>) {
    const expireTime = 25;
    const embed = new EmbedBuilder()
      .setTitle("Alt Text Help")
      .setDescription(expiry(urlWarning, expireTime))
      .setColor(0xf4d7ff);
  
    await originalMessage.reply({ embeds: [embed], allowedMentions: generateAllowedMentions() })
      .then(theReply => {
        setTimeout(() => theReply.delete(), expireTime * 1000);
      });
    await originalMessage.react('🔗');
  }