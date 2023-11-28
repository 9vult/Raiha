import { Attachment, EmbedBuilder, Message } from "discord.js";
import { ServerValue } from "firebase-admin/database";
import { activationFailure } from "../actions/activationFailure.action";
import { generateAIDescription } from "../actions/generateAIDescription.action";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";
import { getMentions } from "../actions/getMentions.action";
import { react } from "../actions/react.action";
import { sendError } from "../actions/sendError.action";
import { CLIENT, db, leaderboards } from "../raiha";

/**
 * Check if this message contains a trigger word
 * @param msg Incoming message to check
 * @returns True if there is a trigger word
 */
export function hasAltCommand(msg: Message<true>): boolean {
  return getAltPosition(msg)[0] !== -1;
}

/**
 * Get the location of the trigger word
 * @param msg Incoming message to check
 * @returns Position of the end of the trigger, or [-1]
 */
export function getAltPosition(msg: Message<true>): number[] {
  let lc = msg.content.toLowerCase();
  let rIndex = lc.search(/\br!/);    // r!
  let altIndex = lc.search(/\balt:/);  // alt:
  let idIndex = lc.search(/\bid:/);    // id:
  let altRIndex = lc.search(/\!r/);    // !r alias

  if (rIndex !== -1) return [rIndex, rIndex + 2]
  if (altRIndex !== -1) return [altRIndex, altRIndex + 2]
  else if (altIndex !== -1) return [altIndex, altIndex + 4]
  else if (idIndex !== -1) return [idIndex, idIndex + 3]
  return [-1];
}

/**
 * Check if this message contains attachments
 * @param msg Incoming message to check
 * @returns True if there are attachments
 */
export function hasAttachments(msg: Message<true>): boolean {
  return msg.attachments && msg.attachments.size !== 0;
}

/**
 * Check if any of the attachments on the message are missing alt text 
 * @param msg Incoming message to check
 */
export function isMissingAltText(msg: Message<true>): boolean {
  for (let attachment of msg.attachments) {
    let file = attachment[1];
    if (!file.contentType?.startsWith('image')) continue;
    if (file.description === null || file.description === undefined || file.description.trim() === '') {
      return true;
    }
  }
  return false;
}

/**
 * Check if the message is a reply
 * @param msg Message to check
 * @returns True if the message is a reply
 */
export function isReply(msg: Message<true>): boolean {
  return msg.reference ? true : false;
}

/**
 * Get the parent of a message
 * @param msg Message to get the parent of
 * @returns Parent of the message
 */
export async function getParent(msg: Message<true>): Promise<Message<true>> {
  return await msg.channel.messages.fetch(msg.reference!.messageId!);
}

/**
 * Check if the message was posted by the bot
 * @param msg Message to check
 * @returns True if the bot was the author
 */
export function wasPostedByBot(msg: Message<true>): boolean {
  let botUser = CLIENT.user;
  return botUser && msg.author.id == botUser.id || false;
}

/**
 * Check if this message contains a delete trigger
 * @param msg Incoming message to check
 * @returns True if delete trigger is present
 */
export function wantsDelete(msg: Message<true>): boolean {
  let lc = msg.content.toLowerCase();
  let delIndex = lc.search(/\bdelete\!/);    // delete!

  if (delIndex !== -1) return true;
  else return false;
}

/**
 * Check if this message contains an edit trigger
 * @param msg Incoming message to check
 * @returns True if edit trigger is present
 */
export function wantsEdit(msg: Message<true>): boolean {
  let lc = msg.content.toLowerCase();
  let isEditRq = lc.startsWith("edit!");    // edit!
  let isSed = lc.startsWith("r/");         // r/abc/def

  if (isEditRq || isSed) return true;
  else return false;
}

/**
 * Retrieve the alt text from the message
 * @param msg Message to parse
 * @param startIndex Index the alt text starts at
 * @returns Array of alt texts
 */
export function parseAltText(msg: Message<true>, startIndex: number): string[] {
  return msg.content.substring(startIndex).trim().split("|");
}

/**
 * Fix attachments by adding alt text
 * @param message Message to fix the attachments for
 * @param altTexts Alt texts to apply
 * @returns Fixed attachments
 */
export async function applyAltText(msg: Message<true>, altTexts: string[]) {
  let fixedFiles: Array<Attachment> = [];
  let index = 0;
  for (let attachment of msg.attachments) {
    if (altTexts[index].trim() == "$$") {
      const imageUrl = attachment[1].url;
      const desc = await generateAIDescription(imageUrl, true, false);
      altTexts[index] = desc.substring(0, 1000);
    }
    else if (altTexts[index].trim() == "$$ocr") {
      const imageUrl = attachment[1].url;
      const desc = await generateAIDescription(imageUrl, true, true);
      altTexts[index] = desc.substring(0, 1000);
    }
    else if (altTexts[index].trim().endsWith("$$ocr")) {
      const imageUrl = attachment[1].url;
      const desc = await generateAIDescription(imageUrl, false, true);
      altTexts[index] = (altTexts[index].replace(/\s\$\$ocr|\$\$ocr/, `: ${desc}`)).substring(0, 1000); // regex matches " $$ocr" and "$$ocr"
    }
    attachment[1].description = altTexts[index++];
    fixedFiles.push(attachment[1]);
  }
  return fixedFiles;
}

/**
 * Bump stats up 1
 */
export function bumpStats() {
  db.ref(`/Statistics/`).child('Requests').set(ServerValue.increment(1));
}

/**
 * Check if the user has Auto Mode enabled
 * @param id Author ID
 * @returns True if Auto Mode is enabled
 */
export function userHasAutoModeEnabled(id: string) {
  return leaderboards.UserSettings?.[id]?.AutoMode;
}

/**
 * Generate auto mode
 * @param message Incoming message to check
 */
export function autoModeGenerator(message: Message<true>): string[] {
  let altTexts: string[] = [];
  for (let attachment of message.attachments) {
    let file = attachment[1];
    if (!file.contentType?.startsWith('image')) altTexts.push('-');
    if (file.description === null || file.description === undefined || file.description.trim() === '') {
      altTexts.push('$$ocr');
    } else {
      altTexts.push(file.description);
    }
  }
  return altTexts;
}

/**
 * Checks if all the attachments are not images
 * @param message Incoming message to check
 */
export function areNotImages(message: Message<true>): boolean {
  for (let attachment of message.attachments) {
    let file = attachment[1];
    if (file.contentType?.startsWith('image')) return false;
  }
  return true;
}

/**
 * Generate alt text & Repost
 * @param cmdMsg Message initiating the procedure
 * @param imgMsg Message containing the images
 * @param auto Whether Auto Mode is to be used
 */
export async function doBotTriggeredAltText(cmdMsg: Message<true>, imgMsg: Message<true>, auto: boolean) {
  const inline = (cmdMsg.id === imgMsg.id);
  const altStartIndex = getAltPosition(cmdMsg);
  const altAuthor = cmdMsg.author.id;
  const opAuthor = imgMsg.author.id;
  let msgParentID = '0';
  let altTexts: string[] = [];
  if (inline) await react(imgMsg, 'ERR_MISSING_ALT_TEXT'); // For good measure
  
  if (auto) altTexts = autoModeGenerator(imgMsg);
  else altTexts = parseAltText(cmdMsg, altStartIndex[1]);

  for (let alt of altTexts) {
    if (alt.trim().length === 0) return await fail('ERR_MISMATCH', cmdMsg, inline);
    if (alt.length > 1000) return await fail('TOO_LONG', cmdMsg, inline, alt.length);
  }
  if (altTexts.length !== imgMsg.attachments.size) return await fail('ERR_MISMATCH', cmdMsg, inline);

  let fixedFiles = await applyAltText(imgMsg, altTexts);
  let mentions = getMentions(imgMsg);
  let allowedMentions = generateAllowedMentions(mentions);
  let sentMsg;
  let repostContent;
  if (!inline) {
    // Reply
    if (opAuthor == altAuthor) repostContent = `_From <@${opAuthor}>${imgMsg.content != '' ? ':_\n\n' + imgMsg.content : '._'}`;
    else repostContent = `_From <@${opAuthor}> with alt text by <@${altAuthor}>${imgMsg.content != '' ? ':_\n\n' + imgMsg.content : '._'}`;
  } else {
    // Inline
    repostContent = `_From <@${imgMsg.author.id}>${altStartIndex[0] > 0 ? ':_\n\n' + imgMsg.content.substring(0, altStartIndex[0]) : '._'}`
  }

  const payload = {
    files: fixedFiles,
    content: repostContent,
    allowedMentions: allowedMentions
  }
  if (isReply(imgMsg)) sentMsg = await (await getParent(imgMsg)).reply(payload);
  else sentMsg = await cmdMsg.channel.send(payload);

  if (inline) {
    msgParentID = sentMsg.id;
  } else {
    msgParentID = imgMsg.id;
  }

  try {
    await imgMsg.delete();
    if (!inline) await cmdMsg.delete();
  } catch (err) {
    await sendError(cmdMsg.guild!.id, "Could not delete", (<Error>err).message, cmdMsg.author!.id, cmdMsg.url);
  }
  let request = cmdMsg.content.substring(altStartIndex[0]).trim();
  if (request.length === 0) request = "[auto]";
  let body = !inline ? imgMsg.content : cmdMsg.content.substring(0, altStartIndex[0]).trim();
  let msgData = {
    Alt: altAuthor,
    OP: opAuthor,
    Parent: msgParentID,
    Request: request,
    Body: body
  };
  db.ref(`/Actions/${cmdMsg.guild!.id}/${cmdMsg.channel!.id}/`).child(sentMsg.id).set(msgData);
  db.ref(`/Leaderboard/Raiha/${cmdMsg.guild!.id}`).child(altAuthor).set(ServerValue.increment(1));
  if (!inline && altAuthor === opAuthor && leaderboards['Loserboard'][cmdMsg.guild!.id][opAuthor] != 0) {
    // Decrement from the loserboard if they call on themselves after the fact
    db.ref(`/Leaderboard/Loserboard/${cmdMsg.guild!.id}`).child(altAuthor).set(ServerValue.increment(-1));
  }
  bumpStats();
}

/**
 * Failure
 * @param code Failure code
 * @param msg Message that failed
 * @param loser If the loserboard should increase
 * @param data Any additional data
 */
export async function fail(code: string, msg: Message<true>, loser: boolean, data: any = undefined) {
  switch(code) {
    case 'TOO_LONG':
      const embed = new EmbedBuilder().setTitle(`Error`).setDescription(`Discord limits alt text to 1000 characters. Your specified alt text is ${data} characters. Please try again.`);
      await msg.reply({ embeds: [embed] });
      break;
    default:
      await react(msg, code);
      if (!loser) await activationFailure(msg); // Loserboard is not activation failure
      break;
  }
  if (loser) {
    db.ref(`/Leaderboard/Loserboard/${msg.guild!.id}`).child(msg.author.id).set(ServerValue.increment(1));
  }
}
