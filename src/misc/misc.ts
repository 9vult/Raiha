import { Message, MessageMentionOptions } from "discord.js";

// FUNCTIONS

/**
 * Get the mentions from the message
 * @param message The message to get mentions for
 * @returns Lists of mentioned users and roles
 */
export const getMentions = (message: Message<boolean>): Array<Array<string>> => {
  let users: Array<string> = [];
  let roles: Array<string> = [];
  if (message.mentions) {
    for (let mention of message.mentions.users) users.push(mention[0]);
    for (let mention of message.mentions.roles) roles.push(mention[0]);
  }
  return [users, roles];
}

/**
 * Generate a list of allowed mentions
 * @param mentions [[Users], [Roles]]
 * @return MessageMentionOptions object
 */
export const generateAllowedMentions = (mentions: Array<Array<string>>): MessageMentionOptions => {
  return {
    parse: [],
    users: mentions[0],
    roles: mentions[1]
  };
}

// STRINGS

export const helpText = `Triggers:\n・ Raiha currently recognizes \`r!\`, \`alt:\`, and \`id:\`\n\nTo add alt text to an **existing message**:\n・ Reply to the message: \`r! Description of the image\`\n・ If the message has multiple images: separate each alt text with a \`|\`: \n\`r! Alt text 1 | Alt text 2 | ...\`\n\nTo add alt text to a **new message**:\n・Add the trigger to the end of your message or on its own line: \n\`Message text here r! Description of the image\`\n・ If the message has multiple images: separate each alt text with a \`|\`: \n\`Message text here r! Alt text 1 | Alt text 2 | ...\`\n・ The trigger & text may go on its own _single_ line at the end\n・ Message text is optional.`;

export const whyText = `Alternative Text (alt text) is a text description of an image that is generally read by a screen reader to allow the visually impared to understand the context of an image. It may also benefit people with processing disorders or impaired mental processing capabilities.\nAdditionally, alt text is beneficial even outside the realm of accessibility—on Discord, alt text is indexed and searchable, allowing you to search for images quickly and easily!`;

