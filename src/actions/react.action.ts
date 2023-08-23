import { Message } from "discord.js";
import { sendError } from "./sendError.action";

export const react = async (message: Message<boolean>, config: { [key: string]: any }, reaction: string) => {
  let serverValue;
  try {
    switch (reaction) {
      case 'ERR_MISSING_ALT_TEXT':
        serverValue = config[message.guild!.id]['errorNoAlt'];
        if (serverValue == 'default') {
          await message.react('❌');
          return;
        } else {
          await message.react(serverValue);
          return;
        }
      case 'ERR_MISMATCH':
        serverValue = config[message.guild!.id]['errorMismatch'];
        if (serverValue == 'default') {
          await message.react('#️⃣');
          await message.react('❌');
          return;
        } else {
          await message.react(serverValue);
          return;
        }
      case 'ERR_NOT_REPLY':
        serverValue = config[message.guild!.id]['errorNotReply'];
        if (serverValue == 'default') {
          await message.react('↩');
          await message.react('❌');
          return;
        } else {
          await message.react(serverValue);
          return;
        }
    }
  } catch (err) {
    await sendError(config, message.guild!.id, "Could not react", (<Error>err).message, message.author.id, message.url);
  }
}