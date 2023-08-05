import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Component, ComponentType, EmbedBuilder } from 'discord.js';
import { OptionalCommandArguments } from '../commands';
import { postLoserboard } from '../misc/leaderboards';
import { getAllowedMentions } from '../misc/misc';
import { startCollections } from './leaderboard';

export default async function (interaction: ChatInputCommandInteraction, { options }: OptionalCommandArguments) {
    await interaction.deferReply();

    const page = options.getNumber('page')?.valueOf() ?? 1;
    const embedContents = await postLoserboard();
    const embeds = embedContents.map(content =>
        new EmbedBuilder()
            .setTitle(`Loserboard (Page ${page}/${embedContents.length})`)
            .setDescription(content)
            .setColor(0xd797ff));

    const reply = await interaction.editReply({
        embeds: [embeds[0]],
        allowedMentions: getAllowedMentions()
    });

    startCollections(interaction, reply, page, embeds);
}