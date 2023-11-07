import { Message } from "discord.js";

/**
 * Get the mentions from the message
 * @param message The message to get mentions for
 * @returns Lists of mentioned users and roles
 */
export const getMentions = ({ mentions }: Message<true>): [string[], string[]] => {
  return mentions
    ? [[...mentions.users].map(([user]) => user), [...mentions.roles].map(([role]) => role)]
    : [[], []] as [string[], string[]];
}