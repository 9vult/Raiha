import { EmbedBuilder, TextChannel } from "discord.js";
import { CLIENT, leaderboards } from "../raiha";
import { Leaderboard } from 'src/misc/types';

export default async function loserboardNotify(incoming: Record<string, Leaderboard>) {
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
        await new Promise(r => setTimeout(r, 60_000));
        if (incomingValue <= value)
          muteNotify(modChannel, user, incomingValue);
      }
      if (enableWarnings && incomingValue != 0 && ((incomingValue + 5) % muteThreshold == 0)) {
        await new Promise(r => setTimeout(r, 60_000));
        if (incomingValue <= value)
          warnNotify(modChannel, user, incomingValue);
      }
      if (specialWarnThresholds && specialWarnThresholds.includes(incomingValue)) { // Not bound to enableWarnings
        await new Promise(r => setTimeout(r, 60_000));
        if (incomingValue <= value)
          warnNotify(modChannel, user, incomingValue);
      }
    }
  }
}

async function muteNotify(channel: string, user: string, value: number) {
  const embed = new EmbedBuilder()
    .setTitle(`Loserboard Alert`)
    .setDescription(`Hello! User <@${user}>'s Loserboard score is now ${value}.\nAn image mute may be warranted.`)
    .setColor(0xf4d7ff);
  const fetchChannel = CLIENT.channels.cache.get(channel);
  if (!fetchChannel?.isTextBased()) return;
  await fetchChannel.send({ embeds: [embed] });
}

async function warnNotify(channel: string, user: string, value: number) {
  const embed = new EmbedBuilder()
    .setTitle(`Loserboard Alert`)
    .setDescription(`Hello! User <@${user}>'s Loserboard score is now ${value}.\nThey should be warned that they are approaching an image mute.`)
    .setColor(0xf4d7ff);
  const fetchChannel = CLIENT.channels.cache.get(channel);
  if (!fetchChannel?.isTextBased()) return;
  await fetchChannel.send({ embeds: [embed] });
}