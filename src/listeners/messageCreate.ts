import { Attachment, Client, EmbedBuilder, Message, MessageMentionOptions } from "discord.js";
import { ServerValue } from 'firebase-admin/database';
import type { Database } from '@firebase/database-types';

import { generateAIDescription } from "../actions/generateAIDescription.action";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";
import { getMentions } from "../actions/getMentions.action";
import { react } from "../actions/react.action";
import { sendError } from "../actions/sendError.action";
import { informNewUser } from "../actions/informNewUser.action";

export default (client: Client, db: Database, leaderboards: {[key:string]:any}): void => {
  client.on('messageCreate', async (message) => {
    const config: {[key:string]:any} = leaderboards['Configuration'];
    // Prereqs
    if (message.author.bot) return;
    let msglc = message.content.toLowerCase();

    let altAuthor = message.author.id;
    let opAuthor = '';
    let msgParentID = '0';

    // Check if the message has attachments
    let hasGoodAttachments = false;
    if (message.attachments && message.attachments.size !== 0) {
      // The message HAS attachments
      if (isMissingAltText(message)) {
        await react(message, config, 'ERR_MISSING_ALT_TEXT');
      } else {
        hasGoodAttachments = true;
        if (!areNotImages(message)) {
          const ref2 = db.ref(`/Leaderboard/Native/`).child(message.author.id);
          ref2.set(ServerValue.increment(1));
        }
      }
      let altStartIndex = getAltPosition(message);
      if (altStartIndex[0] !== -1) {
        // ----- THIS IS A SELF-TRIGGER (Scenario 1) -----
        opAuthor = message.author.id;
        let altTexts = parseAltText(message, altStartIndex[1]);
        for (let alt of altTexts) {
          if (alt.trim().length === 0) {
            await react(message, config, 'ERR_MISMATCH');
            const ref2 = db.ref(`/Leaderboard/Loserboard/`).child(message.author.id);
            ref2.set(ServerValue.increment(1));
            return;
          }
        }
        if (altTexts.length !== message.attachments.size) {
          await react(message, config, 'ERR_MISMATCH');
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
          sendError(config, message.guild!.id, "Could not delete", (<Error>err).message, message.author!.id, message.url);
        }

        let msgData = {
          Alt: altAuthor,
          OP: opAuthor,
	  Parent: sentMsg.id,
          Request: message.content.substring(altStartIndex[0])
        };
        const ref = db.ref(`/Actions/${message.guild!.id}/${message.channel!.id}/`).child(sentMsg.id);
        ref.set(msgData);
        const ref2 = db.ref(`/Leaderboard/Raiha/`).child(message.author.id);
        ref2.set(ServerValue.increment(1));

        // Statistics
        const ref4 = db.ref(`/Statistics/`).child('Requests');
        ref4.set(ServerValue.increment(1));

        return;
      } else {
        // The user posted an image without alt text and did not call the bot :(
        if (!hasGoodAttachments) {
          const ref2 = db.ref(`/Leaderboard/Loserboard/`).child(message.author.id);
          ref2.set(ServerValue.increment(1));
          await informNewUser(message, leaderboards);
        } 
      }
    } else {
      // This message DOES NOT have attachments
      let altStartIndex = getAltPosition(message);
      if (altStartIndex[0] !== 0) return; // Reply trigger must be at start of message (if it exists)
      if (!message.reference) {
        // Trigger message is not a reply
        await react(message, config, 'ERR_NOT_REPLY');
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
          await react(message, config, 'ERR_MISMATCH');
          return;
        }
      }
      if (altTexts.length !== op.attachments.size) {
        await react(message, config, 'ERR_MISMATCH');
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

      if (op.reference) {
        // OP is a reply (2a)
        let parent = await op.channel.messages.fetch(op.reference.messageId!);
        sentMsg = await parent.reply({
          files: fixedFiles,
          content: `_From <@${op.author.id}> with alt text by <@${message.author.id}>${op.content != '' ? ':_\n\n' + op.content : '._'}`,
          allowedMentions: allowedMentions
        });
      } else {
        // This message is not a reply (1b)
        sentMsg = await message.channel.send({
          files: fixedFiles,
          content: `_From <@${op.author.id}> with alt text by <@${message.author.id}>${op.content != '' ? ':_\n\n' + op.content : '._'}`,
          allowedMentions: allowedMentions
        });
      }

      try {
        await op.delete();
        await message.delete();
      } catch (err) {
        sendError(config, message.guild!.id, "Could not delete", (<Error>err).message, message.author!.id, message.url);
      }

      let msgData = {
        Alt: altAuthor,
        OP: opAuthor,
        Parent: msgParentID,
        Request: message.content.substring(altStartIndex[0])
      };
      const ref = db.ref(`/Actions/${message.guild!.id}/${message.channel!.id}/`).child(sentMsg.id);
      ref.set(msgData);

      const ref2 = db.ref(`/Leaderboard/Raiha/`).child(message.author.id);
      ref2.set(ServerValue.increment(1));

      if (message.author.id === op.author.id) {
        if (leaderboards['Loserboard'][op.author.id] != 0) {
          // Decrement from the loserboard if they call on themselves after the fact
          const ref3 = db.ref(`/Leaderboard/Loserboard/`).child(message.author.id);
          ref3.set(ServerValue.increment(-1));
        }
      }

      // Statistics
      const ref4 = db.ref(`/Statistics/`).child('Requests');
      ref4.set(ServerValue.increment(1));

      return;
    }

  });
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

  if (comIndex !== -1) return [comIndex, comIndex + 2]
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

