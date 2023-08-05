import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { OptionalCommandArguments } from '../commands';
import { postRank } from '../misc/leaderboards';
import { getAllowedMentions } from '../misc/misc';

export default async function (interaction: ChatInputCommandInteraction, { options, user }: OptionalCommandArguments) {
    await interaction.deferReply();
    const specifiedUser = options.getUser('user') || user;
    const id = specifiedUser.id;

    const content = await postRank(id);
    const embed = new EmbedBuilder()
        .setTitle("Alt Text Leaderboards")
        .setDescription(content)
        .setColor(0xd797ff);

    await interaction.editReply({ embeds: [embed], allowedMentions: getAllowedMentions() });
}