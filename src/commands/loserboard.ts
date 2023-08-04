import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { OptionalCommandArguments } from '../commands';
import { postLoserboard } from '../misc/leaderboards';
import { generateAllowedMentions } from '../misc/misc';

export default async function (interaction: ChatInputCommandInteraction, { leaderboards, options }: OptionalCommandArguments) {
    await interaction.deferReply();

    const page = options.getNumber('page')?.valueOf() ?? 1;
    const content = await postLoserboard(leaderboards, page);
    const embed = new EmbedBuilder()
        .setTitle(`Loserboard${page !== 1 ? ` (Page ${page})` : ''}`)
        .setDescription(content)
        .setColor(0xd797ff);

    await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
}