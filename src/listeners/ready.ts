import { SlashCommandBuilder } from 'discord.js';
import { CLIENT } from '../raiha';

export default function() {
  if (!CLIENT.user || !CLIENT.application) return;

  // let commands;
  // commands = CLIENT.application?.commands;
  // commands.delete('1105593772286423152').then(console.log).catch(console.error);
  // commands.delete('1177258370667909150').then(console.log).catch(console.error);
  // commands.delete('1159307887156400242').then(console.log).catch(console.error);

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

  const helpCmd = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Raiha short help');

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
    ).addStringOption(opt =>
      opt.setName('operation')
      .setDescription('Should the value be added or subtracted?')
      .setRequired(false)
      .addChoices(
        { name: 'Add', value: 'Add' },
        { name: 'Subtract', value: 'Subtract' },
        { name: 'Replace', value: 'Absolute' }
      )
    );

  const logsCmd = new SlashCommandBuilder()
    .setName('logs')
    .setDescription('View Auto Punishment logs for a user (Mod Only)')
    .addUserOption(opt => 
      opt.setName('user')
      .setDescription('User to view')
      .setRequired(true)
    ).addBooleanOption(opt => 
      opt.setName('verbose')
      .setDescription('Include log ID in output')
      .setRequired(false)
    );

  const delLogCmd = new SlashCommandBuilder()
    .setName('dellog')
    .setDescription('Delete a log (Mod Only)')
    .addStringOption(opt =>
      opt.setName('id')
      .setDescription('ID of the log')
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
  CLIENT.application.commands.create(helpCmd);
  CLIENT.application.commands.create(whyCmd);
  CLIENT.application.commands.create(aboutCmd);
  CLIENT.application.commands.create(altRulesCmd);
  CLIENT.application.commands.create(setCmd);
  CLIENT.application.commands.create(logsCmd);
  CLIENT.application.commands.create(delLogCmd);
  CLIENT.application.commands.create(userSettingCmd);

  console.log('Raiha is ready to go!');
};

