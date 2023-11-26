import { Attachment, Client, EmbedBuilder, Message, MessageMentionOptions } from "discord.js";
import { ServerValue } from 'firebase-admin/database';
import type { Database } from '@firebase/database-types';

import { generateAIDescription } from "../actions/generateAIDescription.action";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";
import { getMentions } from "../actions/getMentions.action";
import { react } from "../actions/react.action";
import { sendError } from "../actions/sendError.action";
import { informNewUser } from "../actions/informNewUser.action";
import { remindUser } from "../actions/remindUser.action";
import { activationFailure } from "../actions/activationFailure.action";
import { leaderboards, db, CLIENT } from '../raiha';
import { checkIsOP } from "../actions/checkIsOP.action";
import { expiry } from "../misc/misc";

export default async function (message: Message) {
  // Prereqs
  if (message.author.bot || !message.inGuild()) return;
  const autoMode = (leaderboards.UserSettings?.[message.author.id]?.AutoMode);

  let altAuthor = message.author.id;
  let opAuthor = '';
  let msgParentID = '0';

  // Check if the message has attachments
  let hasGoodAttachments = false;
  if (message.attachments && message.attachments.size !== 0) {
    // The message HAS attachments
    if (isMissingAltText(message)) {
      await react(message, 'ERR_MISSING_ALT_TEXT');
    } else {
      hasGoodAttachments = true;
      if (!areNotImages(message)) {
        const ref2 = db.ref(`/Leaderboard/Native/${message.guild!.id}`).child(message.author.id);
        ref2.set(ServerValue.increment(1));
      }
    }
    let altStartIndex = getAltPosition(message);
    let shouldUseAutoMode = (!hasGoodAttachments && autoMode)
    if (altStartIndex[0] !== -1 || shouldUseAutoMode) {
      // ----- THIS IS A SELF-TRIGGER (Scenario 1) -----
      // OR Auto-Mode!
      opAuthor = message.author.id;
      let altTexts: string[];
      if (altStartIndex[0] !== -1) altTexts = parseAltText(message, altStartIndex[1]);
      else /* Auto Mode Zone */ {
        altTexts = autoModeGenerator(message);
        altStartIndex[0] = message.content.length;
        altStartIndex[1] = message.content.length;
      }
      for (let alt of altTexts) {
        if (alt.trim().length === 0) {
          await react(message, 'ERR_MISMATCH');
          await activationFailure(message);
          const ref2 = db.ref(`/Leaderboard/Loserboard/${message.guild!.id}`).child(message.author.id);
          ref2.set(ServerValue.increment(1));
          return;
        }
      }
      if (altTexts.length !== message.attachments.size) {
        await react(message, 'ERR_MISMATCH');
        await activationFailure(message);
        return;
      }
      for (let alt of altTexts) {
        if (alt.length > 1000) {
          const embed = new EmbedBuilder().setTitle(`Error`).setDescription(`Discord limitations limit alt text to 1000 characters. Your specified alt text is ${alt.length} characters. Please try again.`);
          await message.reply({ embeds: [embed] });
          return;
        }
      }
      // We have the correct number of alts
      let fixedFiles = await applyAltText(message, altTexts);
      let mentions = getMentions(message);
      let allowedMentions = generateAllowedMentions(mentions);
      let sentMsg;
      if (message.reference) {
        // This message is a reply (1a)
        let parent = await message.channel.messages.fetch(message.reference.messageId!);
        sentMsg = await parent.reply({
          files: fixedFiles,
          content: `_From <@${message.author.id}>${altStartIndex[0] > 0 ? ':_\n\n' + message.content.substring(0, altStartIndex[0]) : '._'}`,
          allowedMentions: allowedMentions
        });
      } else {
        // This message is not a reply (1b)
        sentMsg = await message.channel.send({
          files: fixedFiles,
          content: `_From <@${message.author.id}>${altStartIndex[0] > 0 ? ':_\n\n' + message.content.substring(0, altStartIndex[0]) : '._'}`,
          allowedMentions: allowedMentions
        });
      }

      try {
        await message.delete();
      } catch (err) {
        sendError(message.guild!.id, "Could not delete", (<Error>err).message, message.author!.id, message.url);
      }

      let msgData = {
        Alt: altAuthor,
        OP: opAuthor,
        Parent: sentMsg.id,
        Request: message.content.substring(altStartIndex[0]),
        Body: message.content.substring(0, altStartIndex[0]).trim()
      };
      const ref = db.ref(`/Actions/${message.guild!.id}/${message.channel!.id}/`).child(sentMsg.id);
      ref.set(msgData);
      const ref2 = db.ref(`/Leaderboard/Raiha/${message.guild!.id}`).child(message.author.id);
      ref2.set(ServerValue.increment(1));

      // Statistics
      const ref4 = db.ref(`/Statistics/`).child('Requests');
      ref4.set(ServerValue.increment(1));

      return;
    } else {
      // The user posted an image without alt text and did not call the bot :(
      if (!hasGoodAttachments) {
        const ref2 = db.ref(`/Leaderboard/Loserboard/${message.guild!.id}`).child(message.author.id);
        ref2.set(ServerValue.increment(1));
        await informNewUser(message);
        await remindUser(message);
      }
    }
  } else {
    // This message DOES NOT have attachments

    if (message.reference && wantsDelete(message)) {
      const expireTime = 10;
      let parent = await message.channel.messages.fetch(message.reference.messageId!);
      if (wasPostedByBot(parent)) {
        let isOP = (await checkIsOP(parent, message.author))[0];
        let responseText = '';
        if (isOP) {
          await parent.delete().catch(() => {/* TODO: something here */ })
        } else {
          responseText = 'You are not the author of this message, or this message is not a Raiha message.';
          const embed = new EmbedBuilder()
            .setTitle(`Raiha Message Delete`)
            .setDescription(expiry(responseText, 10))
            .setColor(0xd797ff);
          await message.reply({ embeds: [embed], allowedMentions: generateAllowedMentions() })
          .then(reply => setTimeout(() => reply.delete(), expireTime * 1000));
        }
      }
    }

    if (message.reference && wantsEdit(message)) {
      let parent = await message.channel.messages.fetch(message.reference.messageId!);
      if (wasPostedByBot(parent)) {
        const opLookup = await checkIsOP(parent, message.author)
        let isOP = opLookup[0];
        let opData = opLookup[1];
        if (isOP && opData['Body'] && opData['Body'] != '') {
          let content = message.content;
          if (content.toLowerCase().startsWith("r/")) {
            content = content.substring(2);
            let lookup = content.substring(0, content.search(/\//)).trim();
            let replacement = content.substring(content.search(/\//) + 1).trim();
            let result = opData['Body'].replace(lookup, replacement);
            let oldBody = parent.content;
            let newBody = oldBody.replace(opData['Body'], result);
            await parent.edit({
              content: newBody,
              allowedMentions: generateAllowedMentions()
            });
            await message.delete();
            const ref = db.ref(`/Actions/${message.guild!.id}/${message.channel!.id}/${opData['Parent']}`).child("Body");
            ref.set(result);
          } else if (content.toLowerCase().startsWith("edit!")) {
            let replacement = content.substring(5).trim();
            await parent.edit({
              content: parent.content.replace(opData['Body'], replacement),
              allowedMentions: generateAllowedMentions()
            });
            await message.delete();
            const ref = db.ref(`/Actions/${message.guild!.id}/${message.channel!.id}/${opData['Parent']}`).child("Body");
            ref.set(replacement);
          }
          return;
        }
      }
    }

    let altStartIndex = getAltPosition(message);
    if (altStartIndex[0] !== 0) return; // Reply trigger must be at start of message (if it exists)

    if (!message.reference) {
      // Trigger message is not a reply
      await react(message, 'ERR_NOT_REPLY');
      await activationFailure(message);
      return;
    }
    // ----- THIS IS A REPLY TRIGGER (Scenario 2) -----
    // Get the parent (OP)
    let op = await message.channel.messages.fetch(message.reference.messageId!);
    opAuthor = op.author.id;
    msgParentID = op.id;
    let altTexts = parseAltText(message, altStartIndex[1]);
    for (let alt of altTexts) {
      if (alt.trim().length === 0) {
        await react(message, 'ERR_MISMATCH');
        await activationFailure(message);
        return;
      }
    }
    if (altTexts.length !== op.attachments.size) {
      await react(message, 'ERR_MISMATCH');
      await activationFailure(message);
      return;
    }
    for (let alt of altTexts) {
      if (alt.length > 1000) {
        const embed = new EmbedBuilder().setTitle(`Error`).setDescription(`Discord limitations limit alt text to 1000 characters. Your specified alt text is ${alt.length} characters. Please try again.`);
        await message.reply({ embeds: [embed] });
        return;
      }
    }
    // We have the correct number of alts
    let fixedFiles = await applyAltText(op, altTexts);
    let mentions = getMentions(op);
    let allowedMentions = generateAllowedMentions(mentions);
    let sentMsg;

    let repostContent;
    if (op.author.id == message.author.id) repostContent = `_From <@${op.author.id}>${op.content != '' ? ':_\n\n' + op.content : '._'}`;
    else repostContent = `_From <@${op.author.id}> with alt text by <@${message.author.id}>${op.content != '' ? ':_\n\n' + op.content : '._'}`;

    if (op.reference) {
      // OP is a reply (2a)
      let parent = await op.channel.messages.fetch(op.reference.messageId!);
      sentMsg = await parent.reply({
        files: fixedFiles,
        content: repostContent,
        allowedMentions: allowedMentions
      });
    } else {
      // This message is not a reply (1b)
      sentMsg = await message.channel.send({
        files: fixedFiles,
        content: repostContent,
        allowedMentions: allowedMentions
      });
    }

    try {
      await op.delete();
      await message.delete();
    } catch (err) {
      sendError(message.guild!.id, "Could not delete", (<Error>err).message, message.author!.id, message.url);
    }

    let msgData = {
      Alt: altAuthor,
      OP: opAuthor,
      Parent: msgParentID,
      Request: message.content.substring(altStartIndex[0]),
      Body: message.content.substring(0, altStartIndex[0]).trim()
    };
    const ref = db.ref(`/Actions/${message.guild!.id}/${message.channel!.id}/`).child(sentMsg.id);
    ref.set(msgData);

    const ref2 = db.ref(`/Leaderboard/Raiha/${message.guild!.id}`).child(message.author.id);
    ref2.set(ServerValue.increment(1));

    if (message.author.id === op.author.id) {
      if (leaderboards['Loserboard'][message.guild!.id][op.author.id] != 0) {
        // Decrement from the loserboard if they call on themselves after the fact
        const ref3 = db.ref(`/Leaderboard/Loserboard/${message.guild!.id}`).child(message.author.id);
        ref3.set(ServerValue.increment(-1));
      }
    }

    // Statistics
    const ref4 = db.ref(`/Statistics/`).child('Requests');
    ref4.set(ServerValue.increment(1));

    return;
  }
};

/**
 * Check if any of the attachments on the message are missing alt text 
 * @param message Incoming message to check
 */
const isMissingAltText = (message: Message<boolean>): boolean => {
  for (let attachment of message.attachments) {
    let file = attachment[1];
    if (!file.contentType?.startsWith('image')) continue;
    if (file.description === null || file.description === undefined || file.description.trim() === '') {
      return true;
    }
  }
  return false;
}

/**
 * Generate auto mode
 * @param message Incoming message to check
 */
const autoModeGenerator = (message: Message<boolean>): string[] => {
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
const areNotImages = (message: Message<boolean>): boolean => {
  for (let attachment of message.attachments) {
    let file = attachment[1];
    if (file.contentType?.startsWith('image')) return false;
  }
  return true;
}

/**
 * Check if this message contains a trigger word
 * @param message Incoming message to check
 * @returns Position of the end of the trigger, or [-1]
 */
const getAltPosition = (message: Message<boolean>): Array<number> => {
  let lc = message.content.toLowerCase();
  let comIndex = lc.search(/\br!/);    // r!
  let altIndex = lc.search(/\balt:/);  // alt:
  let idIndex = lc.search(/\bid:/);    // id:
  let aliasIndex = lc.search(/\!r/);    // !r alias

  if (comIndex !== -1) return [comIndex, comIndex + 2]
  if (aliasIndex !== -1) return [aliasIndex, aliasIndex + 2]
  else if (altIndex !== -1) return [altIndex, altIndex + 4]
  else if (idIndex !== -1) return [idIndex, idIndex + 3]
  return [-1];
}

/**
 * Fix attachments by adding alt text
 * @param message Message to fix the attachments for
 * @param altTexts Alt texts to apply
 * @returns Fixed attachments
 */
const applyAltText = async (message: Message<boolean>, altTexts: Array<string>) => {
  let fixedFiles: Array<Attachment> = [];
  let index = 0;
  for (let attachment of message.attachments) {
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
 * Retrieve the alt text from the message
 * @param message Message to parse
 * @param startIndex Index the alt text starts at
 * @returns Array of alt texts
 */
const parseAltText = (message: Message<boolean>, startIndex: number): Array<string> => {
  return message.content.substring(startIndex).trim().split("|");
}

/**
 * Check if the message was posted by the bot
 * @param message Message to check
 * @returns True if the bot was the author
 */
const wasPostedByBot = (message: Message<boolean>): boolean => {
  let botUser = CLIENT.user;
  return botUser && message.author.id == botUser.id || false;
}

/**
 * Check if this message contains a delete trigger
 * @param message Incoming message to check
 * @returns True if delete trigger is present
 */
const wantsDelete = (message: Message<boolean>): boolean => {
  let lc = message.content.toLowerCase();
  let delIndex = lc.search(/\bdelete\!/);    // delete!

  if (delIndex !== -1) return true;
  else return false;
}

/**
 * Check if this message contains an edit trigger
 * @param message Incoming message to check
 * @returns True if edit trigger is present
 */
const wantsEdit = (message: Message<boolean>): boolean => {
  let lc = message.content.toLowerCase();
  let isEditRq = lc.startsWith("edit!");    // edit!
  let isSed = lc.startsWith("r/");         // s/abc/def

  if (isEditRq || isSed) return true;
  else return false;
}
