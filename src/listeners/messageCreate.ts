import { EmbedBuilder, Message } from "discord.js";
import { ServerValue } from 'firebase-admin/database';
import { generateAllowedMentions, getMentions, react, sendError } from '../misc/misc';
import { isMissingAltText, hasImages, getAltPosition, parseAltText, applyAltText } from './util';
import { db, leaderboards } from '../raiha';

export default async function (message: Message) {
  if (message.author.bot) return;
  if (message.attachments.size) handleAttachments(message);
  else handleNoAttachments(message);
};

async function handleAttachments(message: Message) {
  const noAltText = isMissingAltText(message);

  // The message HAS attachments
  if (noAltText) {
    await react(message, leaderboards.Configuration, 'ERR_MISSING_ALT_TEXT');
  } else {
    if (hasImages(message)) {
      db.ref(`/Leaderboard/Native/`)
        .child(message.author.id)
        .set(ServerValue.increment(1));
    }
  }
  const altStartIndex = getAltPosition(message);
  if (altStartIndex[0] === -1) {
    // The user posted an image without alt text and did not call the bot :(
    if (!noAltText) {
      db.ref(`/Leaderboard/Loserboard/`)
        .child(message.author.id)
        .set(ServerValue.increment(1));
    }
    return;
  }
  postAltText(message, message, altStartIndex)
}

async function postAltText(message: Message, original: Message, altStartIndex: [number, number]) {
  const isSameMessage = message == original;
  const isSameAuthor = message.author.id == original.author.id;

  // TODO: distinguish between new and old post
  const altTexts = parseAltText(message, altStartIndex[1]);
  if (altTexts.length !== message.attachments.size) {
    if (isSameAuthor) db.ref(`/Leaderboard/Loserboard/`)
      .child(message.author.id)
      .set(ServerValue.increment(1));
    return await react(message, leaderboards.Configuration, 'ERR_MISMATCH');
  }
  for (const alt of altTexts) {
    if (!alt.trim()) {
      if (isSameAuthor) db.ref(`/Leaderboard/Loserboard/`)
        .child(message.author.id)
        .set(ServerValue.increment(1));
      return await react(message, leaderboards.Configuration, 'ERR_MISMATCH');
    }
    if (alt.length > 1000) {
      const embed = new EmbedBuilder()
        .setTitle(`Error`)
        .setDescription(`Discord limitations limit alt text to 1000 characters. Your specified alt text is ${alt.length} characters. Please try again.`);
      await message.reply({ embeds: [embed] });
      return;
    }
  }

  // We have the correct number of alts
  const messageContent = {
    files: await applyAltText(message, altTexts),
    content: `_From <@${original.author.id}>${!isSameAuthor ? ` With alt text by <@${message.author.id}>` : ""
      }${altStartIndex[0] > 0 ? `:_\n\n${message.content.substring(0, altStartIndex[0])}` : '._'}`,
    allowedMentions: generateAllowedMentions(getMentions(message))
  };

  const sentMessage = original.reference ?
    await (await original.channel.messages.fetch(original.reference.messageId!)).reply(messageContent) :
    await original.channel.send(messageContent);

  try {
    await message.delete();
    if (!isSameMessage) original.delete();
  } catch (err) {
    sendError(leaderboards.Configuration, message.guild!.id, "Could not delete", (<Error>err).message, message.author!.id, message.url);
  }

  // Decrement from the loserboard if they call on themselves after the fact
  if (isSameAuthor && leaderboards.Loserboard[message.author.id]) {
    db.ref(`/Leaderboard/Loserboard/`)
      .child(message.author.id)
      .set(ServerValue.increment(-1));
  }
  db.ref(`/Actions/${message.guild!.id}/${message.channel!.id}/`)
    .child(sentMessage.id)
    .set({
      Alt: message.author.id,
      OP: original.author.id,
      Parent: sentMessage.id,
      Request: message.content.substring(altStartIndex[0])
    });
  db.ref(`/Leaderboard/Raiha/`)
    .child(message.author.id)
    .set(ServerValue.increment(1));
  db.ref(`/Statistics/`)
    .child('Requests')
    .set(ServerValue.increment(1));
}

async function handleNoAttachments(message: Message) {
  // This message DOES NOT have attachments
  let altStartIndex = getAltPosition(message);
  if (altStartIndex[0] !== 0) return; // Reply trigger must be at start of message (if it exists)
  if (!message.reference) {
    // Trigger message is not a reply
    await react(message, leaderboards.Configuration, 'ERR_NOT_REPLY');
    return;
  }
  // ----- THIS IS A REPLY TRIGGER (Scenario 2) -----
  // Get the parent (OP)
  let op = await message.channel.messages.fetch(message.reference.messageId!);
  postAltText(message, op, altStartIndex);
}