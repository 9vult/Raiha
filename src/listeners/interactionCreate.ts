import { EmbedBuilder, Message, GuildMemberRoleManager, Interaction, GuildMember } from "discord.js";
import { postLeaderboard, postLoserboard, postRank } from '../misc/leaderboards';
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";
import { expiry, longHelp, shortHelp, whyText } from '../misc/misc';
import { VERSION, db, leaderboards } from '../raiha';
import { checkIsOP } from "../actions/checkIsOP.action";

export default async function (interaction: Interaction) {
  if (!interaction.isCommand()) return;
  if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;

  const { commandName, options, user } = interaction;

  if (commandName === 'rank') {
    await interaction.deferReply();
    const specifiedUser = options.getUser('user') || user;
    const id = specifiedUser.id;
    const content = postRank(id, interaction.guildId);
    const embed = new EmbedBuilder()
      .setTitle(`Alt Text Leaderboards`)
      .setDescription(content)
      .setColor(0xd797ff);

    await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
    return;
  }

  if (commandName === 'leaderboard') {
    await interaction.deferReply();

    const page = options.getNumber('page')?.valueOf() ?? 1;

    const content = postLeaderboard(interaction.guildId, page);
    const embed = new EmbedBuilder()
      .setTitle(`Alt Text Leaderboards${page !== 1 ? ' (Page ' + page + ')' : ''}`)
      .setDescription(content.text)
      .setFooter({ text: content.footer })
      .setColor(0xd797ff);

    await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
    return;
  }

  if (commandName === 'loserboard') {
    await interaction.deferReply();

    const page = options.getNumber('page')?.valueOf() ?? 1;
    const content = await postLoserboard(interaction.guildId, page);
    const embed = new EmbedBuilder()
      .setTitle(`Loserboard${page !== 1 ? ' (Page ' + page + ')' : ''}`)
      .setDescription(content)
      .setColor(0xd797ff);

    await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
    return;
  }

  if (commandName === 'delete') {
    await interaction.deferReply({ ephemeral: true });

    const messageID = options.getString('msgid')!.valueOf();
    const message = await interaction.channel!.messages.fetch(messageID)
      .catch(async () => {
        const embed = new EmbedBuilder()
          .setTitle("Raiha Message Delete")
          .setDescription(`Could not find the message with ID ${messageID}.`)
          .setColor(0xd797ff);
        await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
        return null;
      })
    if (!message) return;

    let isOP = await checkIsOP(message, user);

    // let isOP = false;
    // let currentMessageID = messageID;
    // // loop safety
    // let idx = 0;
    // let prevRefVal;
    // while (idx < 15) { // if there's ever more than 15... there's a bigger issue than the ability to delete lol
    //   idx++;
    //   const dbRef = db.ref();
    //   const ref = await dbRef.child(`/Actions/${message.guildId}/${message.channel.id}/${currentMessageID}`).get();
    //   if (!ref.exists()) {
    //     if (prevRefVal && prevRefVal['OP'] == user.id)
    //       isOP = true; // experimental(?) to fix deletion not working on after-the-fact alts
    //     break;
    //   }
    //   const refVal = await ref.val();
    //   if (refVal['Parent'] == ref.key) {
    //     // Reached the top-level message
    //     if (refVal['OP'] == user.id) {
    //       isOP = true;
    //       break;
    //     } else break;
    //   } else {
    //     // Still must traverse upwards
    //     currentMessageID = refVal['Parent'];
    //     prevRefVal = refVal;
    //   }
    // }

    let responseText = '';
    if (isOP) {
      await message.delete().catch(() => {/* TODO: something here */ })
      responseText = 'The message was successfully deleted.';
    } else {
      responseText = 'You are not the author of this message, or this message is not a Raiha message.';
    }
    const embed = new EmbedBuilder()
      .setTitle(`Raiha Message Delete`)
      .setDescription(responseText)
      .setColor(0xd797ff);
    await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
    return;
  }

  if (commandName === 'set') {
    await interaction.deferReply();

    const { options, member } = interaction;

    const roles = member.roles.cache;
    if (roles.some(role => role.name === 'Staff')) {
      const specifiedUser = options.getUser('user')!;
      const specifiedBoard = options.getString('board')!.valueOf();
      const specifiedValue = Math.max(0, options.getNumber('value')!.valueOf())

      const ref = db.ref(`/Leaderboard/${specifiedBoard!}/${interaction.guildId}`).child(specifiedUser.id);
      ref.set(specifiedValue);

      const embed = new EmbedBuilder()
        .setTitle(`Leaderboard Override`)
        .setDescription(`Set <@${specifiedUser!.id}>'s **${specifiedBoard!}** value to \`${specifiedValue!}\`.`)
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

  if (commandName === 'usersetting') {
    await interaction.deferReply();

    const { options, user } = interaction;
    const specifiedSetting = options.getString('setting')!.valueOf();
    const specifiedOption = options.getString('option')!.valueOf() == 'YES'

    switch (specifiedSetting) {
      case 'Reminder':
        const ref = db.ref(`/UserSettings/${user.id}`).child('Reminder');
        ref.set(specifiedOption);
        break;
      default:
        break;
    }

    const embed = new EmbedBuilder()
      .setTitle(`Raiha User Settings`)
      .setDescription(`Set ${specifiedSetting} to ${specifiedOption}.`)
      .setColor(0xd797ff);
    await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
    return;
  }

  if (commandName === 'help') {
    const expireTime = 45;
    const embed = new EmbedBuilder()
      .setTitle(`Raiha Help (Condensed)`)
      .setDescription(expiry(shortHelp, expireTime))
      .setColor(0xd797ff);

    await interaction.reply({ embeds: [embed], allowedMentions: generateAllowedMentions() })
      .then(theReply => setTimeout(() => theReply.delete(), expireTime * 1000));
    return;
  }

  if (commandName === 'longhelp') {
    const expireTime = 90;
    const embed = new EmbedBuilder()
      .setTitle(`Raiha Help`)
      .setDescription(expiry(longHelp, expireTime))
      .setColor(0xd797ff);

    await interaction.reply({ embeds: [embed], allowedMentions: generateAllowedMentions() })
      .then(theReply => {
        setTimeout(() => theReply.delete(), expireTime * 1000);
      });
    return;
  }

  if (commandName === 'why') {
    const embed = new EmbedBuilder()
      .setTitle(`Why Use Alt Text?`)
      .setDescription(whyText)
      .setURL(`https://moz.com/learn/seo/alt-text`)
      .setColor(0xd797ff);

    await interaction.reply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
    return;
  }

  if (commandName === 'altrules') {
    let serverValue = leaderboards.Configuration[interaction.guildId].altrules;
    serverValue = serverValue.replaceAll('\\n', '\n');
    if (serverValue == 'default') serverValue = "This server has not specified any alt text rules.";
    const embed = new EmbedBuilder()
      .setTitle(`Alt Text Rules for '${interaction.guild!.name}'`)
      .setDescription(serverValue)
      .setColor(0xd797ff);

    await interaction.reply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
    return;
  }

  if (commandName === 'about') {
    const embed = new EmbedBuilder()
      .setTitle(`Raiha Accessibility Bot`)
      .setDescription(`Version: ${VERSION}\nAuthor: <@248600185423396866>`)
      .setURL(`https://github.com/9vult/Raiha`)
      .setColor(0xd797ff);
    await interaction.reply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
    return;
  }
};
