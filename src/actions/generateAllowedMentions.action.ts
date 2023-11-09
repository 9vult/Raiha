import { Message, MessageMentionOptions } from "discord.js";

/**
 * Generate a list of allowed mentions
 * @param input [[Users], [Roles]] or Message<true>
 * @return MessageMentionOptions object
 */
export default function generateAllowedMentions(input?: [string[], string[]] | Message<true>): MessageMentionOptions {
  if (input instanceof Message) {
    const { mentions: { users, roles } } = input;
    return { parse: [], users: [...users].map(([user]) => user), roles: [...roles].map(([role]) => role) };
  }
  const [users, roles] = input ?? [[], []];
  return { parse: [], users, roles };
}