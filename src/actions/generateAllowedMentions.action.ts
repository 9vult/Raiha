import { MessageMentionOptions } from "discord.js";

/**
 * Generate a list of allowed mentions
 * @param mentions [[Users], [Roles]]
 * @return MessageMentionOptions object
 */
export default function generateAllowedMentions([users, roles]: [string[], string[]] = [[], []]): MessageMentionOptions {
  return {
    parse: [],
    users,
    roles
  };
}