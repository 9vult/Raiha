import { Client } from "discord.js";

export default (client: Client): void => {
  if (!client.user || !client.application) return;

  // Command registration
  // const guildId = '';
  // const guild = client.guilds.cache.get(guildId);
  let commands;

  // if (guild) { 
  //   commands = guild.commands;
  // } else {
  commands = client.application?.commands;
  // }

  commands?.create({
    name: 'rank',
    description: 'Get ranks on the alt text leaderboards',
    options: [
      {
        name: 'user',
        description: 'User to get the rank of',
        required: false,
        type: 6 // USER
      }
    ]
  });

  commands?.create({
    name: 'leaderboard',
    description: 'Get the alt text leaderboard',
    options: [
      {
        name: 'page',
        description: 'Page of the leaderboard to get',
        required: false,
        type: 10 // NUMBER
      }
    ]
  });

  commands?.create({
    name: 'loserboard',
    description: 'Get the alt text loserboard',
    options: [
      {
        name: 'page',
        description: 'Page of the loserboard to get',
        required: false,
        type: 10 // NUMBER
      }
    ]
  });

  commands?.create({
    name: 'delete',
    description: 'Delete a Raiha message',
    options: [
      {
        name: 'msgid',
        description: 'Message ID of the message to delete',
        required: true,
        type: 3 // STRING
      }
    ]
  });

  commands?.create({
    name: 'help',
    description: 'Raiha help'
  });

  commands?.create({
    name: 'why',
    description: 'Why use alt text?'
  });

  commands?.create({
    name: 'about',
    description: 'About Raiha'
  });

  commands?.create({
    name: 'set',
    description: 'Override leaderboard values (Mod Only)',
    options: [
      {
        name: 'user',
        description: 'User to set the value of',
        required: true,
        type: 6 // USER
      },
      {
        name: 'board',
        description: 'Board to set',
        required: true,
        type: 3, // STRING
        choices: [
          { name: 'Native', value: 'Native' },
          { name: 'Raiha', value: 'Raiha' },
          { name: 'Loserboard', value: 'Loserboard' }
        ]
      },
      {
        name: 'value',
        description: 'Value to set the board to',
        required: true,
        type: 10 // NUMBER
      }
    ]
  });

  console.log('Raiha is ready to go!');
};

