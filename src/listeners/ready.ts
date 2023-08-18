import { SlashCommandBuilder } from 'discord.js';
import { CLIENT } from '../raiha';

export default function () {
  const commands = CLIENT.application?.commands;
  if (!CLIENT.user || !commands) return;

  commands.create(
    new SlashCommandBuilder()
      .setName('rank')
      .setDescription('Get ranks on the alt text leaderboards')
      .addUserOption(option => option
        .setName('user')
        .setDescription("User to get the rank of"))
  );

  commands.create(
    new SlashCommandBuilder()
      .setName('leaderboard')
      .setDescription('Get the alt text leaderboard')
      .addNumberOption(option => option
        .setName('page')
        .setDescription("Page of the leaderboard to get"))
  );

  commands.create(
    new SlashCommandBuilder()
      .setName('loserboard')
      .setDescription('Get the alt text loserboard')
      .addNumberOption(option => option
        .setName('page')
        .setDescription("Page of the loserboard to get"))
  );

  commands.create(
    new SlashCommandBuilder()
      .setName('delete')
      .setDescription('Delete a Raiha message')
      .addStringOption(option => option
        .setName('msgid')
        .setDescription("Message ID of the message to delete")
        .setRequired(true))
  );

  commands.create({
    name: 'help',
    description: 'Raiha help'
  });

  commands.create({
    name: 'why',
    description: 'Why use alt text?'
  });

  commands.create({
    name: 'about',
    description: 'About Raiha'
  });

  commands.create(
    new SlashCommandBuilder()
      .setName('set')
      .setDescription("Override leaderboard values (Mod Only)")
      .addUserOption(option => option
        .setName('user')
        .setDescription("User to set the value of")
        .setRequired(true))
      .addStringOption(option => option
        .setName('board')
        .setDescription("Board to set")
        .setRequired(true)
        .addChoices(
          { name: 'Native', value: 'Native' },
          { name: 'Raiha', value: 'Raiha' },
          { name: 'Loserboard', value: 'Loserboard' }
        ))
      .addNumberOption(option => option
        .setName('value')
        .setDescription("Value to set the board to")
        .setRequired(true))
  );

  console.log('Raiha is ready to go!');
};

