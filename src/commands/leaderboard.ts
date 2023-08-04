import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { OptionalCommandArguments } from '../commands';
import { postLeaderboard } from '../misc/leaderboards';
import { generateAllowedMentions } from '../misc/misc';

export default async function (interaction: ChatInputCommandInteraction, { leaderboards, options }: OptionalCommandArguments) {
    await interaction.deferReply();

    const page = options.getNumber('page')?.valueOf() ?? 1;
    const { text, footer } = await postLeaderboard(leaderboards, page);
    const embed = new EmbedBuilder()
        .setTitle(`Alt Text Leaderboards${page !== 1 ? ` (Page ${page})` : ''}`)
        .setDescription(text)
        .setFooter({ text: footer })
        .setColor(0xd797ff);

    await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
}