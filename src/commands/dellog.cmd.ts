import { ChatInputCommandInteraction, EmbedBuilder, GuildMemberRoleManager } from "discord.js";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";
import { db, leaderboards } from "../raiha";

export const DelLogCmd = async (interaction: ChatInputCommandInteraction) => {
  await interaction.deferReply();
  const { options, member, guildId } = interaction;

  let rm = (member!.roles as GuildMemberRoleManager).cache;
  if (rm.has(leaderboards.Configuration[guildId!].modRole)) {
    const specifiedLog = options.getString('id')!;

    let result: string = '';
    if (specifiedLog in leaderboards.AutoPunishmentLogs[guildId!]) {
      db.ref('/AutoPunishmentLogs').child(guildId!).child(specifiedLog).remove();
      result = `Deleted log \`${specifiedLog}\``;
    }
    else {
      `Log \`${specifiedLog}\` was not found.`
    }

    const embed = new EmbedBuilder()
      .setTitle(`Auto Warn/Mute Logs`)
      .setDescription(result)
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