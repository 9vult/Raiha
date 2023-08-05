/**
 * Raiha Accessibility Bot
 * (c) 2022 9volt
 */

import { Client, EmbedBuilder, GatewayIntentBits, TextChannel } from "discord.js";
import messageCreate from "./listeners/messageCreate";
import interactionCreate from "./listeners/interactionCreate";
import ready from "./listeners/ready";
import { DataSnapshot } from '@firebase/database-types';

require('dotenv').config();
const admin = require('firebase-admin');
const firebase = require('../credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(firebase),
  databaseURL: process.env.DATABASE_URL
});

export const VERSION = "2.0.1";

export const db = admin.database();

export interface Data {
  Native: Leaderboard;
  Raiha: Leaderboard;
  Loserboard: Leaderboard;
  Statistics: { Requests: number };
  Configuration: Configuration;
}
export type Leaderboard = { [key: string]: number };
export type SortedLeaderboard = Array<{ user: string, value: number }>;
export interface Configuration {
  [key: string]: {
    errorMismatch: string;
    errorNoAlt: string;
    errorNotReply: string;
    errorChannel: string;
  }
}

export const leaderboards: Data = {
  Native: {},
  Raiha: {},
  Loserboard: {},
  Statistics: { Requests: 0 },
  Configuration: {}
};

export const CLIENT = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

db.ref('/Leaderboard/Native').on("value", (data: DataSnapshot) => {
  leaderboards.Native = data.val() as Leaderboard;
});
db.ref('/Leaderboard/Raiha').on("value", (data: DataSnapshot) => {
  leaderboards.Raiha = data.val() as Leaderboard;
});
db.ref('/Leaderboard/Loserboard').on("value", (data: DataSnapshot) => {
  const parsedData = data.val() as Leaderboard;
  // TODO: move this somewhere else
  checkLoserboard(parsedData);
  leaderboards.Loserboard = parsedData;
});
db.ref('/Statistics').on("value", (data: DataSnapshot) => {
  leaderboards.Statistics = data.val();
});
db.ref('/Configuration').on("value", (data: DataSnapshot) => {
  leaderboards.Configuration = data.val() as Configuration;
});

// Loserboard notifier
async function checkLoserboard(incomingData: Leaderboard) {
  const chan = process.env.MOD_CHANNEL?.toString();
  if (!chan) return;

  for (const [user, losses] of Object.entries(incomingData)) {
    if (!losses || losses <= incomingData[user]) continue;
    // Check if mute threshold hit
    if (losses % 25 && (losses + 5) % 25) continue;
    const warrantsMute = losses % 25 == 0;
    // Wait and see if it remains this way
    await new Promise(r => setTimeout(r, 30000));
    if (losses >= leaderboards.Loserboard[user]) continue; // The board has gone up since, or remained the same
    // Notice zone
    const embed = new EmbedBuilder()
      .setTitle(`Loserboard Alert`)
      .setDescription(`Hello! User <@${user}>'s Loserboard score is now ${losses}.\n${warrantsMute ? "An image mute may be warranted" : "They should be warned that they are approaching an image mute."}.`)
      .setColor(0xf4d7ff);
    (CLIENT.channels.cache.get(chan) as TextChannel).send({ embeds: [embed] })
  }
};

// Set up listeners
CLIENT.on('ready', () => ready(CLIENT));
CLIENT.on('interactionCreate', interaction => interactionCreate(interaction));
CLIENT.on('messageCreate', message => messageCreate(message));
CLIENT.login(process.env.TOKEN);
