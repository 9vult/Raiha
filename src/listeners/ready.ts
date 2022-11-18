import { Client } from "discord.js";

export default (client: Client): void => {
  client.on('ready', async () => {
    if (!client.user || !client.application) return;
    console.log('Raiha is ready to go!');
  });
};