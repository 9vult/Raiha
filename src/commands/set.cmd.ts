import { ChatInputCommandInteraction, EmbedBuilder, GuildMemberRoleManager } from "discord.js";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";
import { ServerValue } from "firebase-admin/database";
import { leaderboards, db } from "../raiha";

export const SetCmd = async (interaction: ChatInputCommandInteraction) => {
  await interaction.deferReply();
  const { options, member } = interaction;
  let rm = (member!.roles as GuildMemberRoleManager).cache;
  if (rm.has(leaderboards.Configuration[interaction.guildId!].modRole)) {
    const specifiedUser = options.getUser('user')!;
    const specifiedBoard = options.getString('board')!;
    const specifiedOperation = options.getString('operation') ?? 'Absolute';
    const specifiedValue = Math.max(0, options.getNumber('value')!);

    const ref = db.ref(`/Leaderboard/${specifiedBoard!}/${interaction.guildId}`).child(specifiedUser.id);
    const originalValue = (await ref.get()).val();
    if (specifiedOperation == 'Add') {
      ref.set(ServerValue.increment(specifiedValue));
    }
    else if (specifiedOperation == 'Subtract') {
      ref.set(ServerValue.increment(-specifiedValue));
    }
    else if (specifiedOperation == 'Absolute') {
      ref.set(specifiedValue);
    }

    const embed = new EmbedBuilder()
      .setTitle(`Leaderboard Override`)
      .setDescription(`Set <@${specifiedUser!.id}>'s **${specifiedBoard!}** value from \`${originalValue!}\` to \`${(await ref.get()).val()!}\`.`)

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