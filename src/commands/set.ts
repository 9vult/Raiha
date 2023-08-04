import { ChatInputCommandInteraction, EmbedBuilder, GuildMemberRoleManager } from 'discord.js';
import { OptionalCommandArguments } from '../commands';
import { postLeaderboard } from '../misc/leaderboards';
import { generateAllowedMentions } from '../misc/misc';

export default async function (interaction: ChatInputCommandInteraction, { options, member, db }: OptionalCommandArguments) {
    await interaction.deferReply();

    const roles = (member.roles as GuildMemberRoleManager).cache;
    if (roles.some(role => role.name === 'Staff')) {
        const specifiedUser = options.getUser('user')!;
        const specifiedBoard = options.getString('board')!.valueOf();
        const specifiedValue = Math.max(0, options.getNumber('value')!.valueOf());


        const ref = db.ref(`/Leaderboard/${specifiedBoard}`).child(specifiedUser.id);
        ref.set(specifiedValue!);

        const embed = new EmbedBuilder()
            .setTitle("Leaderboard Override")
            .setDescription(`Set <@${specifiedUser.id}>'s **${specifiedBoard}** value to \`${specifiedValue}\`.`)
            .setColor(0xd797ff);
        await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
    } else {
        // User does NOT have the 'Staff' role
        const embed = new EmbedBuilder()
            .setTitle("Leaderboard Override")
            .setDescription("You do not have sufficient permission to perform this action.")
            .setColor(0xd797ff);
        await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
    }
}