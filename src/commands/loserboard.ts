import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { OptionalCommandArguments } from '../commands';
import { postLoserboard } from '../misc/leaderboards';
import { getAllowedMentions } from '../misc/misc';
import { startCollections } from './leaderboard';

export default async function (interaction: ChatInputCommandInteraction, { options }: OptionalCommandArguments) {
  await interaction.deferReply();

  const embedContents = await postLoserboard();
  const page = Math.min(Math.max(1, options.getNumber('page')?.valueOf() ?? 1), embedContents.length);
  const embeds = embedContents.map((content, num) =>
    new EmbedBuilder()
      .setTitle(`Loserboard (Page ${num + 1}/${embedContents.length})`)
      .setDescription(content)
      .setColor(0xd797ff));

  const reply = await interaction.editReply({
    embeds: [embeds[page - 1]],
    allowedMentions: getAllowedMentions()
  });

  startCollections(interaction, reply, page, embeds);
}