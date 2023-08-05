import { EmbedBuilder, Message } from "discord.js";
import { ServerValue } from 'firebase-admin/database';
import { getAllowedMentions, react, sendError } from '../misc/misc';
import { isMissingAltText, hasImages, getAltPosition, parseAltText, applyAltText, checkLoserboard } from './messageUtil';
import { db } from '../raiha';

export default async function (message: Message) {
  if (message.author.bot) return;
  if (message.attachments.size) handleAttachments(message);
  else handleNoAttachments(message);
};

async function handleAttachments(message: Message) {
  const noAltText = isMissingAltText(message);

  // The message HAS attachments
  if (noAltText) {
    await react(message, 'ERR_MISSING_ALT_TEXT');
  } else if (hasImages(message)) {
    await db.ref(`/Leaderboard/Native/`)
      .child(message.author.id)
      .set(ServerValue.increment(1));
  }
  const altStartIndex = getAltPosition(message);
  if (altStartIndex[0] === -1) {
    // The user posted an image without alt text and did not call the bot :(
    if (noAltText) {
      await db.ref(`/Leaderboard/Loserboard/`)
        .child(message.author.id)
        .set(ServerValue.increment(1));
      checkLoserboard(message.author.id, message.guild!.id);
    }
    return;
  }
  const successfulPost = await postAltText(message, message, altStartIndex);
  if (!successfulPost) {
    await db.ref(`/Leaderboard/Loserboard/`)
      .child(message.author.id)
      .set(ServerValue.increment(1));
    checkLoserboard(message.author.id, message.guild!.id);
  }
}

async function handleNoAttachments(message: Message) {
  // This message DOES NOT have attachments
  const altStartIndex = getAltPosition(message);
  if (altStartIndex[0] !== 0) return; // Reply trigger must be at start of message (if it exists)
  if (!message.reference) {
    // Trigger message is not a reply
    await react(message, 'ERR_NOT_REPLY');
    return;
  }
  // ----- THIS IS A REPLY TRIGGER (Scenario 2) -----
  // Get the parent (OP)
  const original = await message.channel.messages.fetch(message.reference.messageId!);
  const successfulPost = await postAltText(message, original, altStartIndex);
  if (successfulPost && message.author.id == original.author.id) {
    await db.ref(`/Leaderboard/Loserboard/`)
      .child(message.author.id)
      .set(ServerValue.increment(-1));
  }
}

// Function that posts the original text with alt text, returns if the post was successful or not
async function postAltText(message: Message, original: Message, altStartIndex: [number, number]): Promise<boolean> {
  const isSameMessage = message == original;
  const isSameAuthor = message.author.id == original.author.id;

  // TODO: distinguish between new and old post
  const altTexts = parseAltText(message, altStartIndex[1]);
  if (!await verifyAltTexts(message, original, altTexts)) return false;

  // We have the correct number of alts
  const messageContent = {
    files: await applyAltText(original, altTexts),
    content: `_From <@${original.author.id}>${!isSameAuthor ? ` With alt text by <@${message.author.id}>` : ""}` +
      `${altStartIndex[0] > 0 ? `:_\n\n${message.content.substring(0, altStartIndex[0])}` : '._'}`,
    allowedMentions: getAllowedMentions(message.mentions)
  };

  const sentMessage = original.reference ?
    await (await original.channel.messages.fetch(original.reference.messageId!)).reply(messageContent) :
    await original.channel.send(messageContent);

  try {
    await message.delete();
    if (!isSameMessage) await original.delete();
  } catch (err) {
    sendError(message.guild!.id, "Could not delete", (<Error>err).message, message.author!.id, message.url);
  }

  await db.ref(`/Actions/${message.guild!.id}/${message.channel!.id}/`)
    .child(sentMessage.id)
    .set({
      Alt: message.author.id,
      OP: original.author.id,
      Parent: sentMessage.id,
      Request: message.content.substring(altStartIndex[0])
    });
  await db.ref(`/Leaderboard/Raiha/`)
    .child(message.author.id)
    .set(ServerValue.increment(1));
  await db.ref(`/Statistics/`)
    .child('Requests')
    .set(ServerValue.increment(1));
  return true;
}

// Verify that the alt texts are valid to the unalted images
async function verifyAltTexts(message: Message, original: Message, altTexts: string[]): Promise<boolean> {
  if (altTexts.length !== original.attachments.size) {
    await react(message, 'ERR_MISMATCH');
    return false;
  }
  for (const alt of altTexts) {
    if (!alt.trim()) {
      await react(message, 'ERR_MISMATCH');
      return false;
    }
    if (alt.length > 1000) {
      const embed = new EmbedBuilder()
        .setTitle(`Error`)
        .setDescription(`Discord limitations limit alt text to 1000 characters. Your specified alt text is ${alt.length} characters. Please try again.`);
      await message.reply({ embeds: [embed] });
      return false;
    }
  }
  return true;
}