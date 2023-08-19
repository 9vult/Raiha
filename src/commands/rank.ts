import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { OptionalCommandArguments } from '../commands';
import { getAllowedMentions } from '../misc/misc';
import { leaderboards } from '../raiha';

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

async function postRank(id: string) {
    const { Native, Raiha, Loserboard } = leaderboards;
    const [native, raiha, loser] = [Native, Raiha, Loserboard].map(leaderboard => {
        const value = leaderboard[id] ?? 0;
        return {
            value,
            rank: value ? Object.values(leaderboard).reduce((a, b) => a + (b > value ? 1 : 0), 0) + 1 : null,
        }
    })
    return `Leaderboard ranking for <@${id}>:\n` +
        `__**Native**__\n${native.rank ? `#${native.rank}` : 'Unranked'} with a count of ${native.value}.\n` +
        `__**Raiha**__\n${raiha.rank ? `#${raiha.rank}` : 'Unranked'} with a count of ${raiha.value}.\n` +
        `__**Loserboard**__\n${loser.rank ? `#${loser.rank}` : 'Unranked'} with a count of ${loser.value}.`;
}