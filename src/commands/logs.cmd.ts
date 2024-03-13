import { ChatInputCommandInteraction, EmbedBuilder, GuildMemberRoleManager } from "discord.js";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";
import { leaderboards } from "../raiha";

export const LogsCmd = async (interaction: ChatInputCommandInteraction) => {
  await interaction.deferReply();
  const { options, member, guildId } = interaction;

  let rm = (member!.roles as GuildMemberRoleManager).cache;
  if (rm.has(leaderboards.Configuration[guildId!].modRole)) {
    const specifiedUser = options.getUser('user')!;
    const verbose = options.getBoolean('verbose') ?? false;

    const pairs = Object.entries(leaderboards.AutoPunishmentLogs[guildId!])
      .filter(p => p[1].user == specifiedUser)
      .sort((a, b) => a[1].timestamp - b[1].timestamp)

    let body = `Logs for <@${specifiedUser.id}>:\n`;
    let idx = 1;
    for (let [key, log] of pairs) {
      let dTimestamp = Math.floor(log.timestamp / 1000);
      let minutes = log.timeout;
      switch (log.type) {
        case 'WARN':
          body += `${idx++}. \`Warn\` at <t:${dTimestamp}:f>${verbose? ` (\`${key}\`)` : ''}\n`;
          break;
        case 'IMGMUTE':
          body += `${idx++}. \`Mute\` at <t:${dTimestamp}:f> for ${minutes / 60 / 24} days${verbose? ` (\`${key}\`)` : ''}\n`;
          break;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`Auto Warn/Mute Logs`)
      .setDescription(body.trim())
      .setColor(0xd797ff);
    await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
    return;
  } else {
    // User does NOT have the 'Staff' role
    const embed = new EmbedBuilder()
      .setTitle(`Leaderboard Override`)
      .setDescription(`Unfortunately, you do not have sufficient permission to perform this action.`)
      .setColor(0xd797ff);
    await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
    return;
  }
}