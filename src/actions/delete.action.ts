import { Message } from "discord.js";
import { sendError } from "./sendError.action";

export async function delmsg(message: Message<true>) {
  try {
    await message.delete();
  } catch (err) {
    await sendError(message.guild.id, `Could not delete`, (err as Error).message, message.author.id, message.url);
  }
}