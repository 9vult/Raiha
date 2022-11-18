/**
 * Raiha Accessibility Bot
 * (c) 2022 9volt
 */

import { Client, GatewayIntentBits } from "discord.js";
import messageCreate from "./listeners/messageCreate";
import ready from "./listeners/ready";

require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Set up listeners
ready(client);
messageCreate(client);

client.login(process.env.TOKEN);