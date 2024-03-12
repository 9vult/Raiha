import { EmbedBuilder, TextChannel } from "discord.js";
import { CLIENT, leaderboards, db } from "../raiha";
import { AutoPunishment, AutoPunishmentLog, Leaderboard } from 'src/misc/types';
import { parse } from 'mathjs';
import { generateAllowedMentions } from "./generateAllowedMentions.action";
import { autoPunishmentApply } from "./autoPunishmentApply.action";
import { sendDm } from "./sendDm.action";

export async function loserboardNotify(incoming: Record<string, Leaderboard>) {
  if (!leaderboards.Loserboard || !incoming) return;
  const { Loserboard, Configuration } = leaderboards;

  for (const [guildId, loserboard] of Object.entries(Loserboard)) {
    const incomingGuild = incoming[guildId];
    if (!incomingGuild) continue;

    const { muteThreshold, enableWarnings, modChannel, specialWarnThresholds } = Configuration[guildId];
    if (muteThreshold <= 0) continue;

    for (const [user, value] of Object.entries(loserboard)) {
      const incomingValue = incomingGuild[user];
      if (!incomingValue || incomingValue <= value) continue;

      if (incomingValue != 0 && (incomingValue % muteThreshold == 0)) {
        delayedMuteCheck(guildId, modChannel, user, incomingValue);
      }
      if (enableWarnings && incomingValue != 0 && ((incomingValue + 5) % muteThreshold == 0)) {
        delayedWarnCheck(guildId, modChannel, user, incomingValue);
      }
      if (specialWarnThresholds && specialWarnThresholds.includes(incomingValue)) { // Not bound to enableWarnings
        delayedWarnCheck(guildId, modChannel, user, incomingValue);
      }
    }
  }
}

async function delayedMuteCheck(guildId: string, channel: string, user: string, incomingValue: number) {
  setTimeout(async () => {
    // Check if the threshold is still met after 60 seconds
    if (incomingValue <= leaderboards.Loserboard[guildId][user]) {
      muteNotify(guildId, channel, user, incomingValue);
      tryAutoPunishment(guildId, channel, user, incomingValue);
    }
  }, 60 * 1000);
}

async function delayedWarnCheck(guildId: string, channel: string, user: string, incomingValue: number) {
  setTimeout(async () => {
    // Check if the threshold is still met after 60 seconds
    if (incomingValue <= leaderboards.Loserboard[guildId][user]) {
      warnNotify(guildId, channel, user, incomingValue);
    }
  }, 60 * 1000);
}

async function muteNotify(guildId: string, channel: string, user: string, value: number) {
  const auto = leaderboards.Configuration[guildId].autoPunishment;
  const desc = (auto)
    ? `Hello! User <@${user}>'s Loserboard score is now ${value}.\nThey have been notified automatically.`
    : `Hello! User <@${user}>'s Loserboard score is now ${value}.\nAn image mute may be warranted.`;

  const embed = new EmbedBuilder()
    .setTitle(`${auto ? '[Auto] ' : ''}Loserboard Alert (Mute)`)
    .setDescription(desc)
    .setColor(0xf4d7ff);
  const fetchChannel = CLIENT.channels.cache.get(channel);
  if (!fetchChannel?.isTextBased()) return;
  await fetchChannel.send({ embeds: [embed] });
}

async function warnNotify(guildId: string, channel: string, user: string, value: number) {
  const auto = leaderboards.Configuration[guildId].autoPunishment;
  const desc = (auto)
    ? `Hello! User <@${user}>'s Loserboard score is now ${value}.\nThey have been notified automatically.`
    : `Hello! User <@${user}>'s Loserboard score is now ${value}.\nThey should be warned that they are approaching an image mute.`;

  const embed = new EmbedBuilder()
    .setTitle(`${auto ? '[Auto] ' : ''}Loserboard Alert (Warn)`)
    .setDescription(desc)
    .setColor(0xf4d7ff);
  const fetchChannel = CLIENT.channels.cache.get(channel);
  if (!fetchChannel?.isTextBased()) return;
  await fetchChannel.send({ embeds: [embed] });

  if (auto) {
    const autoEmbed = new EmbedBuilder()
      .setTitle(`Alt Text Warning`)
      .setDescription(`You have been warned in \`${CLIENT.guilds.cache.get(guildId)?.name}\` because your Loserboard score has reached **${value}**.\nSee the server's \`/altrules\` for more information.\n_This action was performed automatically._`)
      .setColor(0xf4d7ff);
    sendDm(user, autoEmbed);
    const log: AutoPunishmentLog = {
      guild: guildId,
      user: user,
      type: 'WARN',
      timestamp: Date.now(),
      timeout: 0
    }
    db.ref('/AutoPunishmentLogs').push(log);
  }
}

async function tryAutoPunishment(guild: string, channel: string, user: string, value: number) {
  if (!leaderboards.Configuration[guild]?.autoPunishment) return;
  try {
    const formula = parse(leaderboards.Configuration[guild].autoPunishmentFormula);
    const minutes: number = formula.evaluate({ x: value });
    const timeout = Date.now() + (minutes * 60000);

    let dbData: AutoPunishment = {
      guild,
      user,
      timeout
    }

    db.ref('/AutoPunishments').push(dbData);
    autoPunishmentApply(guild, user);

    const log: AutoPunishmentLog = {
      guild,
      user,
      type: 'IMGMUTE',
      timestamp: Date.now(),
      timeout
    }
    db.ref('/AutoPunishmentLogs').push(log);

    const discordTime = Math.floor(timeout  / 1000);

    const embed = new EmbedBuilder()
      .setTitle(`Auto Punishments`)
      .setDescription(`<@&${leaderboards.Configuration[guild].autoPunishmentRole}> has been applied to <@${user}>.\nThe role will automatically be removed on <t:${discordTime}:f> (${minutes / 60 / 24} days).`)
      .setColor(0xf4d7ff);
    const fetchChannel = CLIENT.channels.cache.get(channel);
    if (!fetchChannel?.isTextBased()) return;
    await fetchChannel.send({ embeds: [embed], allowedMentions: generateAllowedMentions() });

    const autoEmbed = new EmbedBuilder()
      .setTitle(`Alt Text Warning`)
      .setDescription(`You have been image muted in \`${CLIENT.guilds.cache.get(guild)?.name}\` because your Loserboard score has reached **${value}**.\nYour image mute will expire on <t:${discordTime}:f> (${minutes / 60 / 24} days).\nSee the server's \`/altrules\` for more information.\n_This action was performed automatically._`)
      .setColor(0xf4d7ff);
    sendDm(user, autoEmbed);

  } catch (error) { }
}