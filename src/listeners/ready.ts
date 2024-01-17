import { SlashCommandBuilder } from 'discord.js';
import { CLIENT } from '../raiha';

export default function() {
  if (!CLIENT.user || !CLIENT.application) return;

  // Command registration
  // const guildId = '';
  // const guild = CLIENT.guilds.cache.get(guildId);
  let commands;

  // if (guild) { 
  //   commands = guild.commands;
  // } else {
  commands = CLIENT.application?.commands;
  // }

  const rankCmd = new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Get ranks on the alt text leaderboards')
    .addUserOption(opt => 
      opt.setName('user')
      .setDescription('User to get the rank of')
      .setRequired(false)
    );

  const leaderboardCmd = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Get the alt text leaderboard')
    .addNumberOption(opt =>
      opt.setName('page')
      .setDescription('Page of the leaderboard to get')
      .setRequired(false)
    );
  
  const loserboardCmd = new SlashCommandBuilder()
    .setName('loserboard')
    .setDescription('Get the alt text loserboard')
    .addNumberOption(opt =>
      opt.setName('page')
      .setDescription('Page of the loserboard to get')
      .setRequired(false)
    );

  const deleteCmd = new SlashCommandBuilder()
  .setName('delete')
  .setDescription('Delete a Raiha message')
  .addStringOption(opt => 
    opt.setName('msgid')
    .setDescription('Message ID of the message to delete')
    .setRequired(true)
  );

  const helpCmd = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Raiha short help');

  const longHelpCmd = new SlashCommandBuilder()
  .setName('longhelp')
  .setDescription('Raiha long help');

  const editHelpCmd = new SlashCommandBuilder()
  .setName('edithelp')
  .setDescription('Raiha editing help');

  const whyCmd = new SlashCommandBuilder()
  .setName('why')
  .setDescription('Why use alt text?');

  const aboutCmd = new SlashCommandBuilder()
  .setName('about')
  .setDescription('About Raiha');

  const altRulesCmd = new SlashCommandBuilder()
  .setName('altrules')
  .setDescription('Server alt-text rules');

  const setCmd = new SlashCommandBuilder()
  .setName('set')
  .setDescription('Override leaderboard values (Mod Only)')
  .addUserOption(opt =>
    opt.setName('user')
    .setDescription('User to set the value of')
    .setRequired(true)
  ).addStringOption(opt =>
    opt.setName('board')
    .setDescription('Board to set')
    .setRequired(true)
    .addChoices(
      { name: 'Native', value: 'Native' },
      { name: 'Raiha', value: 'Raiha' },
      { name: 'Loserboard', value: 'Loserboard' }
    )
  ).addNumberOption(opt =>
    opt.setName('value')
    .setDescription('Value to set the board to')
    .setRequired(true)
  );

  const userSettingCmd = new SlashCommandBuilder()
    .setName('usersetting')
    .setDescription('Raiha user settings')
    .addStringOption(opt =>
      opt.setName('setting')
      .setDescription('Setting to set')
      .setRequired(true)
      .setChoices(
        { name: 'Reminder', value: 'Reminder' },
        { name: 'Activation Failure', value: 'ActivationFailure' },
        { name: 'Auto', value: 'AutoMode' }
      )
    ).addStringOption(opt =>
      opt.setName('option')
      .setDescription('Setting value')
      .setRequired(true)
      .setChoices(
        { name: 'YES', value: 'YES' },
        { name: 'NO', value: 'NO' }
      )
    );

    CLIENT.application.commands.create(rankCmd);
    CLIENT.application.commands.create(leaderboardCmd);
    CLIENT.application.commands.create(loserboardCmd);
    CLIENT.application.commands.create(deleteCmd);
    CLIENT.application.commands.create(helpCmd);
    CLIENT.application.commands.create(longHelpCmd);
    CLIENT.application.commands.create(editHelpCmd);
    CLIENT.application.commands.create(whyCmd);
    CLIENT.application.commands.create(aboutCmd);
    CLIENT.application.commands.create(altRulesCmd);
    CLIENT.application.commands.create(setCmd);
    CLIENT.application.commands.create(userSettingCmd);

  console.log('Raiha is ready to go!');
};

