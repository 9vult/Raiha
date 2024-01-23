import { EmbedBuilder, Message } from "discord.js";
import { ServerValue } from "firebase-admin/database";
import { checkIsOP } from "../actions/checkIsOP.action";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";
import { areNotImages, doBotTriggeredAltText, doBotTriggeredTranscription, fail, getParent, hasAttachments, isAudioMessage, isMissingAltText, isReply, userHasAutoModeEnabled, wasPostedByBot } from "../misc/messageHandlerHelper";
import { AutoMode, expiry } from "../misc/misc";
import { db, leaderboards } from "../raiha";
import { informNewUser } from "../actions/informNewUser.action";
import { remindUser } from "../actions/remindUser.action";
import { informNewAutoModeOptOut } from "../actions/informNewAutoModeOptOut";
import { urlCheck } from "../actions/urlCheck.action";
import { urlCheckWarning } from "../actions/urlCheckWarning.action";
import { urlCheckLoserboard } from "../actions/urlCheckLoserboard.action";
import parseTriggers from "../actions/parseTriggers.action";
import { NoTrigger, Trigger, TriggerType } from "../misc/types";

export async function handleMessage(msg: Message<true>) {
  if (msg.author.bot || !msg.inGuild()) return;

  let triggerData = parseTriggers(msg);

  if (isReply(msg)) {
    const parent = await getParent(msg);
    switch (triggerData.type) {
      case TriggerType.EDIT:
        return await editTriggerBranch(msg, parent, triggerData);
      case TriggerType.DELETE:
        return await deleteTriggerBranch(msg, parent, triggerData);
      case TriggerType.TRANSCRIPTION:
        return await doBotTriggeredTranscription(msg, parent);
      default:
        break;
    }
  }

  switch (triggerData.type) {
    case TriggerType.TRANSCRIPTION:
      return await doBotTriggeredTranscription(msg, msg);
    case TriggerType.ALT:
      return await botCallBranch(msg, triggerData);
    default:
      break;
  }

  if (isAudioMessage(msg)) return await doBotTriggeredTranscription(msg, msg);
  return await noBotCallBranch(msg);
}

async function botCallBranch(msg: Message<true>, triggerData: Trigger) {
  // Has attachments - Self trigger mode
  if (hasAttachments(msg)) return await doBotTriggeredAltText(msg, msg, false, triggerData);
  // No attachments
  // Starts with trigger but is not a reply - fail
  if (triggerData.position == 0 && !isReply(msg)) return await fail('ERR_NOT_REPLY', msg, false);
  // Not a reply and the trigger is not at the start: ignore
  if (!isReply(msg)) return;
  // Reply trigger mode
  const parent = await getParent(msg);
  if (!hasAttachments(parent)) return await fail('ERR_NOT_REPLY', msg, false);
  return await doBotTriggeredAltText(msg, parent, false, triggerData);
}

async function noBotCallBranch(msg: Message<true>) {
  if (urlCheck(msg)) {
    urlCheckWarning(msg);
    urlCheckLoserboard(msg);
  }
  if (!hasAttachments(msg)) return;

  if (isMissingAltText(msg)) {
    const autoModeMode = userHasAutoModeEnabled(msg.author.id);
    if ([AutoMode.ON, AutoMode.IMPLICIT].includes(autoModeMode)) {
      if (autoModeMode == AutoMode.ON || (leaderboards.Configuration[msg.guild.id].autoModeOptOut && autoModeMode == AutoMode.IMPLICIT)) {
        await informNewAutoModeOptOut(msg);
        return await doBotTriggeredAltText(msg, msg, true, NoTrigger);
      }
    }
    await informNewUser(msg);
    await remindUser(msg);
    return await fail('ERR_MISSING_ALT_TEXT', msg, true);
  } else {
    if (!areNotImages(msg)) {
      db.ref(`/Leaderboard/Native/${msg.guild!.id}`).child(msg.author.id).set(ServerValue.increment(1));
    }
  }
}

async function deleteTriggerBranch(msg: Message<true>, parent: Message<true>, triggerData: Trigger) {
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

async function editTriggerBranch(msg: Message<true>, parent: Message<true>, triggerData: Trigger) {
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
