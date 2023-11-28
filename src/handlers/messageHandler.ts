import { EmbedBuilder, Message } from "discord.js";
import { ServerValue } from "firebase-admin/database";
import { checkIsOP } from "../actions/checkIsOP.action";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";
import { areNotImages, doBotTriggeredAltText, fail, getAltPosition, getParent, hasAltCommand, hasAttachments, isMissingAltText, isReply, userHasAutoModeEnabled, wantsDelete, wantsEdit, wasPostedByBot } from "../misc/messageHandlerHelper";
import { expiry } from "../misc/misc";
import { db } from "../raiha";

export async function handleMessage(msg: Message<true>) {
  if (msg.author.bot || !msg.inGuild()) return;

  if (isReply(msg)) {
    const parent = await getParent(msg);
    if (wantsEdit(msg)) return await editTriggerBranch(msg, parent);
    if (wantsDelete(msg)) return await deleteTriggerBranch(msg, parent);
  }

  if (hasAltCommand(msg)) return await botCallBranch(msg);
  return await noBotCallBranch(msg);
}

async function botCallBranch(msg: Message<true>) {
  if (hasAttachments(msg)) return await doBotTriggeredAltText(msg, msg, false);
  // No attachments
  if (!isReply(msg)) return await fail('ERR_NOT_REPLY', msg, false);
  const parent = await getParent(msg);
  if (!hasAttachments(parent)) return await fail('ERR_NOT_REPLY', msg, false);
  if (getAltPosition(msg)[0] !== 0) return; // Reply trigger must be at start of message
  return await doBotTriggeredAltText(msg, parent, false);
}

async function noBotCallBranch(msg: Message<true>) {
  if (!hasAttachments(msg)) return;
  
  if (isMissingAltText(msg)) {
    if (userHasAutoModeEnabled(msg.author.id)) {
      return await doBotTriggeredAltText(msg, msg, true);
    }
    return await fail('ERR_MISSING_ALT_TEXT', msg, true);
  } else {
    if (!areNotImages(msg)) {
      db.ref(`/Leaderboard/Native/${msg.guild!.id}`).child(msg.author.id).set(ServerValue.increment(1));
    }
  }
}

async function deleteTriggerBranch(msg: Message<true>, parent: Message<true>) {
  const expireTime = 10;
  if (!wasPostedByBot(parent)) return 
  let isOP = (await checkIsOP(parent, msg.author))[0];
  let responseText = '';
  if (isOP) {
    await parent.delete().catch(() => {/* TODO: something here */ })
    await msg.delete().catch(() => {/* TODO: something here */ })
  } else {
    responseText = 'You are not the author of this message, or this message is not a Raiha message.';
    const embed = new EmbedBuilder()
      .setTitle(`Raiha Message Delete`)
      .setDescription(expiry(responseText, 10))
      .setColor(0xd797ff);
    await msg.reply({ embeds: [embed], allowedMentions: generateAllowedMentions() })
    .then(reply => setTimeout(() => reply.delete(), expireTime * 1000));
  }
}

async function editTriggerBranch(msg: Message<true>, parent: Message<true>) {
  if (!wasPostedByBot(parent)) return;
  const opLookup = await checkIsOP(parent, msg.author);
  let isOP = opLookup[0];
  let opData = opLookup[1];
  if (!(isOP && opData['Body'] && opData['Body'] != '')) return 
  
  let content = msg.content;
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
    await msg.delete();
    db.ref(`/Actions/${msg.guild!.id}/${msg.channel!.id}`).child(`${opData['Parent']}`).set(opData);
    db.ref(`/Actions/${msg.guild!.id}/${msg.channel!.id}/${opData['Parent']}`).child("Body").set(result);
  } else if (content.toLowerCase().startsWith("edit!")) {
    let replacement = content.substring(5).trim();
    await parent.edit({
      content: parent.content.replace(opData['Body'], replacement),
      allowedMentions: generateAllowedMentions()
    });
    await msg.delete();
    db.ref(`/Actions/${msg.guild!.id}/${msg.channel!.id}/${opData['Parent']}`).child("Body").set(replacement);
  }
  return;
}
