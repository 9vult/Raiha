import { Message } from "discord.js";
import { sendError } from "./sendError.action";
import { leaderboards } from '../raiha';

export async function react(message: Message<true>, reaction: string) {
  const config = leaderboards.Configuration;
  let serverValue;
  try {
    switch (reaction) {
      case 'ERR_MISSING_ALT_TEXT':
        serverValue = config[message.guild.id]['errorNoAlt'];
        if (serverValue == 'default') {
          await message.react('❌');
          return;
        } else {
          await message.react(serverValue);
          return;
        }
      case 'ERR_MISMATCH':
        serverValue = config[message.guild.id]['errorMismatch'];
        if (serverValue == 'default') {
          await message.react('#️⃣');
          await message.react('❌');
          return;
        } else {
          await message.react(serverValue);
          return;
        }
      case 'ERR_NOT_REPLY':
        serverValue = config[message.guild.id]['errorNotReply'];
        if (serverValue == 'default') {
          await message.react('↩');
          await message.react('❌');
          return;
        } else {
          await message.react(serverValue);
          return;
        }
      case 'WARN_LINK':
        await message.react('🔗');
        return;
      case 'AUDIO_ERROR':
        await message.react('❌');
        return;
      case 'OK':
        await message.react('✅');
        return;
      case 'REMOVE_REACTIONS':
        await message.reactions.removeAll();
        break;
    }
  } catch (err) {
    await sendError(message.guild.id, `Could not react with ${reaction}`, (err as Error).message, message.author.id, message.url);
  }
}