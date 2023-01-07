import { Client } from "discord.js";

export default (client: Client): void => {
  client.on('ready', async () => {
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
      description: 'Get the alt text leaderboard'
    });

    commands?.create({
      name: 'loserboard',
      description: 'Get the alt text loserboard'
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

    console.log('Raiha is ready to go!');
  });
};

