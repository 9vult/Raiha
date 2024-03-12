import { CLIENT, leaderboards } from "../raiha";

export function autoPunishmentRemove(guildId: string, userId: string) {
  if (leaderboards.Configuration[guildId]?.autoPunishment == false) return;
  const roleId = leaderboards.Configuration[guildId].autoPunishmentRole;

  const guild = CLIENT.guilds.cache.get(guildId);
  if (!guild) return;

  const member = guild.members.cache.get(userId);
  if (!member) return;

  const role = guild.roles.cache.get(roleId);
  if (!role) return;

  member.roles.remove(role);
}