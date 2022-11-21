import { Attachment, Client, EmbedBuilder, Message, MessageMentionOptions } from "discord.js";
import { Database } from 'firebase-admin/database';

const VERSION = "1.1.0";

export default (client: Client, admin: any, db: Database): void => {
  client.on('messageCreate', async (message) => {

    // Prereqs
    let msglc = message.content.toLowerCase()
    if (msglc === 'r?why') {
      const embed = new EmbedBuilder()
        .setTitle(`Why use alt text?`)
        .setDescription(`Alternative Text (alt text) is a text description of an image that is generally read by a screen reader to allow the visually impared to understand the context of an image. It may also benefit people with processing disorders or impaired mental processing capabilities.\nAdditionally, alt text is beneficial even outside the realm of accessibility—on Discord, alt text is indexed and searchable, allowing you to search for images quickly and easily!`)
        .setColor(0xd797ff)
        .setURL(`https://moz.com/learn/seo/alt-text`);
      await message.reply({ embeds: [embed] });
      return;
    }
    if (msglc === 'r?raiha') {
      const embed = new EmbedBuilder()
        .setTitle(`Raiha Accessibility Bot`)
        .setDescription(`Version: ${VERSION}\nAuthor: <@248600185423396866>\n\nFor help: \`r?\` or \`r?help\`\nFor why: \`r?why\`\nFor this: \`r?raiha\``)
        .setColor(0xd797ff);
      await message.reply({ embeds: [embed], allowedMentions: generateAllowedMentions([[], []]) });
      return;
    }
    if (msglc === 'r?' || msglc === 'r?help') {
      const embed = new EmbedBuilder()
        .setTitle(`Raiha Help`)
        .setDescription(`Triggers:\n・ Raiha currently recognizes \`r!\`, \`alt:\`, and \`id:\`\n\nTo add alt text to an **existing message**:\n・ Reply to the message: \`r! Description of the image\`\n・ If the message has multiple images: separate each alt text with a \`|\`: \n\`r! Alt text 1 | Alt text 2 | ...\`\n\nTo add alt text to a **new message**:\n・Add the trigger to the end of your message or on its own line: \n\`Message text here r! Description of the image\`\n・ If the message has multiple images: separate each alt text with a \`|\`: \n\`Message text here r! Alt text 1 | Alt text 2 | ...\`\n・ The trigger & text may go on its own _single_ line at the end\n・ Message text is optional\n\nFor help: \`r?\` or \`r?help\`\nFor why: \`r?why\`\nFor info: \`r?raiha\``)
        .setColor(0xd797ff);
      await message.reply({ embeds: [embed] });
      return;
    }

    if (msglc === 'r?top') {
      db.ref('/Leaderboard/').once("value", function(data) {
        postLeaderboard(message, data.val());
      });
      return;
    }


    // Check if the message has attachments
    let hasGoodAttachments = false;
    if (message.attachments && message.attachments.size !== 0) {
      // The message HAS attachments
      if (isMissingAltText(message)) {
        await message.react('❌');
      } else {
        hasGoodAttachments = true;
        if (!areNotImages(message)) {
          const ref2 = db.ref(`/Leaderboard/Native/`).child(message.author.id);
          ref2.set(admin.database.ServerValue.increment(1));
        }
      }
      let altStartIndex = getAltPosition(message);
      if (altStartIndex[0] !== -1) {
        // ----- THIS IS A SELF-TRIGGER (Scenario 1) -----
        let altTexts = parseAltText(message, altStartIndex[1]);
        if (altTexts.length !== message.attachments.size) {
          await message.react('#️⃣');
          await message.react('❌');
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
        let fixedFiles = applyAltText(message, altTexts);
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
	
        await message.delete();

        let msgData = {
          OP: message.author.id,
          Reference: sentMsg.url,
          Request: message.content.substring(altStartIndex[0])
        };
        const ref = db.ref(`/Log/Author/${message.author.id}/`).child(sentMsg.id);
        ref.set(msgData);
        const ref2 = db.ref(`/Leaderboard/Raiha/`).child(message.author.id);
        ref2.set(admin.database.ServerValue.increment(1));

        return;
      } else {
        // The user posted an image without alt text and did not call the bot :(
        if (!hasGoodAttachments) {
          const ref2 = db.ref(`/Leaderboard/Loserboard/`).child(message.author.id);
          ref2.set(admin.database.ServerValue.increment(1));
        } 
      }
    } else {
      // This message DOES NOT have attachments
      let altStartIndex = getAltPosition(message);
      if (altStartIndex[0] !== 0) return; // Reply trigger must be at start of message (if it exists)
      if (!message.reference) {
        // Trigger message is not a reply
        await message.react('↩');
        await message.react('❌');
        return;
      }
      // ----- THIS IS A REPLY TRIGGER (Scenario 2) -----
      // Get the parent (OP)
      let op = await message.channel.messages.fetch(message.reference.messageId!);
      let altTexts = parseAltText(message, altStartIndex[1]);
      if (altTexts.length !== op.attachments.size) {
        await message.react('#️⃣');
        await message.react('❌');
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
      let fixedFiles = applyAltText(op, altTexts);
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

      await op.delete();
      await message.delete();

      let msgData = {
        OP: op.author.id,
        Reference: sentMsg.url,
        Request: message.content.substring(altStartIndex[0])
      };
      const ref = db.ref(`/Log/Author/${message.author.id}/`).child(sentMsg.id);
      ref.set(msgData);

      const ref2 = db.ref(`/Leaderboard/Raiha/`).child(message.author.id);
      ref2.set(admin.database.ServerValue.increment(1));

      if (message.author.id === op.author.id) {
        // Decrement from the loserboard if they call on themselves after the fact
        const ref3 = db.ref(`/Leaderboard/Loserboard/`).child(message.author.id);
        ref3.set(admin.database.ServerValue.increment(-1));
      }
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
const applyAltText = (message: Message<boolean>, altTexts: Array<string>) => {
  let fixedFiles: Array<Attachment> = [];
  let index = 0;
  for (let attachment of message.attachments) {
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
 * Get the mentions from the message
 * @param message The message to get mentions for
 * @returns Lists of mentioned users and roles
 */
const getMentions = (message: Message<boolean>): Array<Array<string>> => {
  let users: Array<string> = [];
  let roles: Array<string> = [];
  if (message.mentions) {
    for (let mention of message.mentions.users) users.push(mention[0]);
    for (let mention of message.mentions.roles) roles.push(mention[0]);
  }
  return [users, roles];
}

const generateAllowedMentions = (mentions: Array<Array<string>>): MessageMentionOptions => {
  return {
    parse: [],
    users: mentions[0],
    roles: mentions[1]
  };
}

const postLeaderboard = async (message: Message<boolean>, results: any) => {
  let nativeS: any[] = [];
  let raihaS: any[] = [];

  for (var k in results['Native']) {
    nativeS.push([k, results['Native'][k]]);
  }
  nativeS.sort((a, b) => { return b[1] - a[1]; });
  for (var k in results['Raiha']) {
    raihaS.push([k, results['Raiha'][k]]);
  }
  raihaS.sort((a, b) => { return b[1] - a[1]; });
  const embed = new EmbedBuilder()
    .setTitle(`Alt Text Leaderboards`)
    .setDescription(`__**Native**__\n${nativeS.length > 1 ? '1. <@' + nativeS[1][0] + '> — ' + nativeS[1][1] + '\n' : 'Leaderboard Error'}${nativeS.length > 2 ? '2. <@' + nativeS[2][0] + '> — ' + nativeS[2][1] + '\n' : ''}${nativeS.length > 3 ? '3. <@' + nativeS[3][0] + '> — ' + nativeS[3][1] + '\n' : ''}${nativeS.length > 4 ? '4. <@' + nativeS[4][0] + '> — ' + nativeS[4][1] + '\n' : ''}${nativeS.length > 5 ? '5. <@' + nativeS[5][0] + '> — ' + nativeS[5][1] + '\n' : ''}\n__**Raiha**__\n${raihaS.length > 0 ? '1. <@' + raihaS[0][0] + '> — ' + raihaS[0][1] + '\n' : 'Leaderboard Error'}${raihaS.length > 1 ? '2. <@' + raihaS[1][0] + '> — ' + raihaS[1][1] + '\n' : ''}${raihaS.length > 2 ? '3. <@' + raihaS[2][0] + '> — ' + raihaS[2][1] + '\n' : ''}${raihaS.length > 3 ? '4. <@' + raihaS[3][0] + '> — ' + raihaS[3][1] + '\n' : ''}${raihaS.length > 4 ? '5. <@' + raihaS[4][0] + '> — ' + raihaS[4][1] + '\n' : ''}`)
    .setColor(0xd797ff);
  await message.reply({ embeds: [embed] });
}
