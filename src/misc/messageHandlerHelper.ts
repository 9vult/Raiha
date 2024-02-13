import { Attachment, EmbedBuilder, Message } from "discord.js";
import { ServerValue } from "firebase-admin/database";
import { activationFailure } from "../actions/activationFailure.action";
import { generateAIDescription } from "../actions/generateAIDescription.action";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";
import { getMentions } from "../actions/getMentions.action";
import { react } from "../actions/react.action";
import { sendError } from "../actions/sendError.action";
import { CLIENT, db, leaderboards } from "../raiha";
import { AiResult, Trigger } from "./types";
import { Gpt } from "../actions/gpt.action";
import { AutoMode } from "./misc";
import { Whisper } from "../actions/whisper.action";
var parseSRT = require('parse-srt');
const { getAudioDurationInSeconds } = require('get-audio-duration')

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

export function isAudioMessage(msg: Message<true>): boolean {
  if (!hasAttachments(msg)) return false;
  for (let attachment of msg.attachments) {
    let file = attachment[1];
    if (!file.contentType?.startsWith('audio')) return false;
    return (file.name == "voice-message.ogg")
  }
  return false;
}

/**
 * Retrieve the alt text from the message
 * @param triggerData: Incoming data about the message
 * @returns Array of alt texts
 */
export function parseAltText(triggerData: Trigger): string[] {
  return triggerData.body?.split("|") ?? [];
}

/**
 * Fix attachments by adding alt text
 * @param message Message to fix the attachments for
 * @param altTexts Alt texts to apply
 * @returns Fixed attachments
 */
export async function applyAltText(msg: Message<true>, altTexts: string[], triggerData: Trigger) {
  let fixedFiles: Array<Attachment> = [];
  let altTextResults: AiResult[] = [];
  let index = 0;
  let override;
  if (triggerData.override && triggerData.override.key.toLowerCase() == "model")
    if (triggerData.override.value.toLowerCase() == "gpt" || triggerData.override.value.toLowerCase() == "azure")
      override = triggerData.override.value;

  for (let attachment of msg.attachments) {
    if (altTexts[index].trim() == "$$") {
      if (attachment[1].contentType == "image/gif") {
        const gifResult: AiResult = { desc: "gif", ocr: "" }
        altTextResults.push(gifResult);
        altTexts[index] = gifResult.desc;
      } else {
        const imageUrl = attachment[1].url;
        const openaiEnabled = leaderboards.Configuration[msg.guild.id].openai;
        let ai: AiResult;
        if (openaiEnabled) {
          if (!override || (override && override == 'gpt')) {
            ai = { desc: await Gpt(imageUrl) ?? "", ocr: "" }
            if (ai.desc.startsWith('[[error]]')) {
              msg.reply(`An error occured. Please consider manually adding alt text to the affected image(s).\n${ai.desc.replace(/\(.+\)/, '')}`);
              ai.desc = "[An error occured while generating alt text for this image.]";
            }
          }
          else
            ai = await generateAIDescription(imageUrl, true, false);
        } else {
          ai = await generateAIDescription(imageUrl, true, false);
        }
        const desc = ai.desc;
        altTextResults.push(ai);
        altTexts[index] = desc.substring(0, 1000);
      }
    }
    else if (altTexts[index].trim() == "$$ocr") {
      if (attachment[1].contentType == "image/gif") {
        const gifResult: AiResult = { desc: "gif", ocr: "" }
        altTextResults.push(gifResult);
        altTexts[index] = gifResult.desc;
      } else {
        const imageUrl = attachment[1].url;
        const openaiEnabled = leaderboards.Configuration[msg.guild.id].openai;
        let ai: AiResult;
        if (openaiEnabled) {
          if (!override || (override && override == 'gpt')) {
            ai = { desc: await Gpt(imageUrl) ?? "", ocr: "" }
            if (ai.desc.startsWith('[[error]]')) {
              msg.reply(`An error occured. Please consider manually adding alt text to the affected image(s).\n${ai.desc.replace(/\(.+\)/, '')}`);
              ai.desc = "[An error occured while generating alt text for this image.]";
            }
          }
          else
          ai = await generateAIDescription(imageUrl, true, true);
        } else {
          ai = await generateAIDescription(imageUrl, true, true);
        }
        altTextResults.push(ai);
        const desc = ai.ocr.length > 0 ? `${ai.desc}: ${ai.ocr}`.replace('\n', ' \n') : ai.desc;
        altTextResults.push(ai);
        altTexts[index] = desc.substring(0, 1000);
      }
    }
    else if (altTexts[index].trim().endsWith("$$ocr")) {
      if (attachment[1].contentType != "image/gif") {
        const imageUrl = attachment[1].url;
        const ai = await generateAIDescription(imageUrl, false, true);
        altTextResults.push(ai);
        const desc = ai.ocr;
        altTexts[index] = (altTexts[index].replace(/\s\$\$ocr|\$\$ocr/, `: ${desc}`)).substring(0, 1000); // regex matches " $$ocr" and "$$ocr"
      }
    } else {
      altTextResults.push({ desc: altTexts[index], ocr: "" });
    }
    attachment[1].description = altTexts[index++];
    fixedFiles.push(attachment[1]);
  }
  return { files: fixedFiles, alts: altTextResults };
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
export function userHasAutoModeEnabled(id: string): AutoMode {
  let user =  leaderboards.UserSettings?.[id];
  if (user == undefined) return AutoMode.IMPLICIT;
  let amSetting = user.AutoMode;
  if (amSetting == undefined) return AutoMode.IMPLICIT;
  
  return amSetting ? AutoMode.ON : AutoMode.OFF;
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

export async function doBotTriggeredTranscription(cmdMsg: Message<true>, audioMsg: Message<true>, triggerData: Trigger) {
  const openaiEnabled = leaderboards.Configuration[cmdMsg.guild.id].openai;
  if (!openaiEnabled) return;

  if (!hasAttachments(audioMsg)) {
    await cmdMsg.react('❌');
    return;
  }
  let transcriptions = "";
  for (let attachment of audioMsg.attachments) {
    let file = attachment[1];
    let ct = file.contentType ?? "";
    let type: "text" | "srt";
    // Defaults
    if (ct.startsWith('audio')) type = "text";
    else if (ct.startsWith('video')) type = "srt";
    else return;
    // Override
    if (triggerData.override)
      if (triggerData.override.key.toLowerCase() == "type")
        if (triggerData.override.value == "text" || triggerData.override.value == "srt")
          type = triggerData.override.value;
    // Continue with defaults for all other cases

    if (file.size > (25 * 1000000)) {
      await cmdMsg.react('❌');
      cmdMsg.reply({ content: `Sorry, but this file is too big. Raiha can only transcribe files up to 25 MB. (${file.size / 1000000})`, allowedMentions: generateAllowedMentions() });
      return;
    }

    const dur = await getAudioDurationInSeconds(file.url);
    if (dur > (5 * 60)) {
      await cmdMsg.react('❌');
      cmdMsg.reply({ content: `Sorry, but this file is too long. Raiha can only transcribe files up to 5 minutes long. (${dur / 60})`, allowedMentions: generateAllowedMentions() });
      return;
    }

    await cmdMsg.react('✅');
    let transcription = await Whisper(file.url, file.name, type);
    if (transcription == "") continue;

    if (type == "srt") {
      let builder = "";
      let srtAsJson = parseSRT(transcription);
      for (let line of srtAsJson) {
        builder += `[${new Date(line.start * 1000).toISOString().substring(15, 19)}]: ${line.text}\n`;
      }
      transcriptions += `\`\`\`\n${builder}\n\`\`\`\n`;
    } else {
      transcriptions += `> ${transcription}\n`;
    }

  }
  if (transcriptions.length > 0) {
    audioMsg.reply({ content: transcriptions.trim(), allowedMentions: generateAllowedMentions() });
    if (cmdMsg.id !== audioMsg.id)
      await cmdMsg.delete();
    else
      cmdMsg.reactions.removeAll(); // not the greatest but sure
    return;
  } else {
    await cmdMsg.react('❌');
    return;
  }
}

/**
 * Generate alt text & Repost
 * @param cmdMsg Message initiating the procedure
 * @param imgMsg Message containing the images
 * @param auto Whether Auto Mode is to be used
 */
export async function doBotTriggeredAltText(cmdMsg: Message<true>, imgMsg: Message<true>, auto: boolean, triggerData: Trigger) {
  const inline = (cmdMsg.id === imgMsg.id);
  const altAuthor = cmdMsg.author.id;
  const opAuthor = imgMsg.author.id;
  let msgParentID = '0';
  let altTexts: string[] = [];
  if (inline) await react(imgMsg, 'ERR_MISSING_ALT_TEXT'); // For good measure
  
  if (auto) altTexts = autoModeGenerator(imgMsg);
  else altTexts = parseAltText(triggerData);

  for (let alt of altTexts) {
    if (alt.trim().length === 0) return await fail('ERR_MISMATCH', cmdMsg, inline);
    if (alt.length > 1000) return await fail('TOO_LONG', cmdMsg, inline, alt.length);
  }
  if (altTexts.length !== imgMsg.attachments.size) return await fail('ERR_MISMATCH', cmdMsg, inline);

  await cmdMsg.react('✅');
  const applied = await applyAltText(imgMsg, altTexts, triggerData);
  let fixedFiles = applied.files;
  let mentions = getMentions(imgMsg);
  let allowedMentions = generateAllowedMentions(mentions);
  let sentMsg;
  let repostContent;

  const pimbm = leaderboards.Configuration[imgMsg.guild.id].placeInMessageBodyMode;
  let pimbmMessage: string;
  switch (pimbm) {
    case "off":
      pimbmMessage = "";
      break;
    case "all":
       pimbmMessage = applied.alts.reduce((acc, cur) => acc += (cur.ocr.length > 0 ? `ID: ${cur.desc}: ${cur.ocr}` : `ID: ${cur.desc}`) + '\n', '').trim();
       break;
    case "description":
      pimbmMessage = applied.alts.reduce((acc, cur) => acc += `ID: ${cur.desc}` + '\n', '').trim();
      break;
    default:
      pimbmMessage = "";
      break;
  }

  if (!inline) {
    // Reply
    if (opAuthor == altAuthor) repostContent = `_From <@${opAuthor}>${imgMsg.content != '' ? ':_\n\n' + imgMsg.content : '._'}`;
    else repostContent = `_From <@${opAuthor}> with alt text by <@${altAuthor}>${imgMsg.content != '' ? ':_\n\n' + imgMsg.content : '._'}`;
  } else {
    // Inline
    // 
    if (auto && triggerData.position <= 0)
      repostContent = `_From <@${imgMsg.author.id}>${imgMsg.content.trim().length > 0 ? ':_\n\n' + imgMsg.content.trim() : '._'}`
    else
      repostContent = `_From <@${imgMsg.author.id}>${triggerData.position > 0 ? ':_\n\n' + imgMsg.content.substring(0, triggerData.position) : '._'}`
  }

  if (pimbmMessage.length > 0) repostContent = repostContent + `\n\n${pimbmMessage}`;

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
  let request = cmdMsg.content.substring(triggerData.position).trim();
  if (request.length === 0) request = "[auto]";
  let body = !inline ? imgMsg.content : cmdMsg.content.substring(0, triggerData.position).trim();
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
