import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType, EmbedBuilder, Message } from 'discord.js';
import { OptionalCommandArguments } from '../commands';
import { postLeaderboard } from '../misc/leaderboards';
import { getAllowedMentions } from '../misc/misc';

export default async function (interaction: ChatInputCommandInteraction, { options }: OptionalCommandArguments) {
    await interaction.deferReply();

    const embedContents = await postLeaderboard();
    const page = Math.min(Math.max(1, options.getNumber('page')?.valueOf() ?? 1), embedContents.length);
    const embeds = embedContents.map(({ text, footer }, num) =>
        new EmbedBuilder()
            .setTitle(`Alt Text Leaderboards (Page ${num + 1}/${embedContents.length})`)
            .setDescription(text)
            .setFooter({ text: footer })
            .setColor(0xd797ff));

    const reply = await interaction.editReply({
        embeds: [embeds[page - 1]],
        allowedMentions: getAllowedMentions()
    });

    startCollections(interaction, reply, page, embeds);
}

export async function startCollections(interaction: ChatInputCommandInteraction, reply: Message, page: number, embeds: EmbedBuilder[]) {
    if (embeds.length == 1) return;
    try {
        await interaction.editReply({ components: [getButtons(page, embeds.length)] });
    } catch {
        console.error("Could not add page buttons.")
        return;
    }

    const pageCollector = interaction.channel!.createMessageComponentCollector({
        filter: ({ user, message }) => user.id == interaction.user.id && message.id == reply.id,
        componentType: ComponentType.Button,
        time: 180 * 1000
    })

    pageCollector.on('collect', async collection => {
        const newPage = collection.customId == "previous" ? page - 1 : page + 1;
        if (!embeds[newPage - 1]) return;
        page = newPage;
        collection.update({ embeds: [embeds[page - 1]], components: [getButtons(page, embeds.length)] })
            .catch(() => console.error("Could not update leaderboard."));
    })

    pageCollector.on('end', async () => {
        await interaction.editReply({ components: [] })
            .catch(() => console.error("Embed buttons could not be removed."));
    })
}

function getButtons(pageNumber: number, maxPages: number) {
    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('previous')
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(pageNumber == 1),
            new ButtonBuilder()
                .setCustomId('next')
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(pageNumber == maxPages),
        )
}