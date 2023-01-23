import { Attachment, Client, EmbedBuilder, Message, MessageMentionOptions, GuildMemberRoleManager } from "discord.js";
import { Database } from 'firebase-admin/database';

import { postLeaderboard, postLoserboard, postRank } from '../misc/leaderboards';
import { generateAllowedMentions, helpText, whyText } from '../misc/misc';
import { VERSION } from '../raiha';

export default (client: Client, admin: any, db: Database, leaderboards: {[key:string]:any}): void => {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options, user } = interaction;

    if (commandName === 'rank') {
      await interaction.deferReply();
      const specifiedUser = options.getUser('user') || user;
      const id = specifiedUser.id;

      const content = await postRank(id, leaderboards);
      const embed = new EmbedBuilder()
        .setTitle(`Alt Text Leaderboards`)
        .setDescription(content)
        .setColor(0xd797ff);

      await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions([[], []]) });
      return;
    }

    if (commandName === 'leaderboard') {
      await interaction.deferReply();

      const content = await postLeaderboard(leaderboards);
      const embed = new EmbedBuilder()
        .setTitle(`Alt Text Leaderboards`)
        .setDescription(content.text)
        .setFooter({ text: content.footer })
        .setColor(0xd797ff);

      await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions([[], []]) });
      return;
    }

    if (commandName === 'loserboard') {
      await interaction.deferReply();

      const content = await postLoserboard(leaderboards);
      const embed = new EmbedBuilder()
        .setTitle(`Loserboard`)
        .setDescription(content)
        .setColor(0xd797ff);

      await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions([[], []]) });
      return;
    }

    if (commandName === 'set') {
      await interaction.deferReply();

      const { commandName, options, user, member } = interaction;

      let roles = (member!.roles as GuildMemberRoleManager).cache;
      if (roles.some(role => role.name === 'Staff')) {
        const specifiedUser = options.getUser('user');
        const specifiedBoard = options.get('board')!.value!;
        let specifiedValue = options.get('value')!.value!;
        specifiedValue = (specifiedValue! < 0) ? 0 : specifiedValue;

        const ref = db.ref(`/Leaderboard/${specifiedBoard!}`).child(specifiedUser!.id);
        ref.set(specifiedValue!);

        const embed = new EmbedBuilder()
          .setTitle(`Leaderboard Override`)
          .setDescription(`Set <@${specifiedUser!.id}>'s **${specifiedBoard!}** value to \`${specifiedValue!}\`.`)
          .setColor(0xd797ff);
        await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions([[], []]) });
        return;
      } else {
        // User does NOT have the 'Staff' role
        const embed = new EmbedBuilder()
          .setTitle(`Leaderboard Override`)
          .setDescription(`Unfortunately, you do not have sufficient permission to perform this action.`)
          .setColor(0xd797ff);
        await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions([[], []]) });
        return;
      }
    }

    if (commandName === 'help') {
      const embed = new EmbedBuilder()
        .setTitle(`Raiha Help`)
        .setDescription(helpText)
        .setColor(0xd797ff);

      await interaction.reply({ embeds: [embed], allowedMentions: generateAllowedMentions([[], []]) });
      return;
    }

    if (commandName === 'why') {
      const embed = new EmbedBuilder()
        .setTitle(`Why Use Alt Text?`)
        .setDescription(whyText)
        .setURL(`https://moz.com/learn/seo/alt-text`)
        .setColor(0xd797ff);

      await interaction.reply({ embeds: [embed], allowedMentions: generateAllowedMentions([[], []]) });
      return;
    }

    if (commandName === 'about') {
      const embed = new EmbedBuilder()
        .setTitle(`Raiha Accessibility Bot`)
        .setDescription(`Version: ${VERSION}\nAuthor: <@248600185423396866>`)
        .setURL(`https://github.com/9vult/Raiha`)
        .setColor(0xd797ff);
      await interaction.reply({ embeds: [embed], allowedMentions: generateAllowedMentions([[], []]) });
      return;
    }

  });
};
