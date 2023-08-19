/**
 * Raiha Accessibility Bot
 * (c) 2022 9volt
 */

import { Client, GatewayIntentBits } from "discord.js";
import messageCreate from "./listeners/messageCreate";
import interactionCreate from "./listeners/interactionCreate";
import ready from "./listeners/ready";
import { DataSnapshot } from '@firebase/database-types';

require('dotenv').config();
const admin = require('firebase-admin');
const firebase = require('../firebase.json');

admin.initializeApp({
  credential: admin.credential.cert(firebase),
  databaseURL: process.env.DATABASE_URL
});

export const VERSION = "2.0.1";

export const db = admin.database();

interface Data {
  Native: Leaderboard;
  Raiha: Leaderboard;
  Loserboard: Leaderboard;
  Milestones: Leaderboard;
  Statistics: Statistics;
  Configuration: Configuration;
}
export type Leaderboard = { [key: string]: number };
export type SortedLeaderboard = { user: string, value: number }[];
interface Statistics {
  Requests?: number
}
interface Configuration {
  [key: string]: {
    errorMismatch?: string;
    errorNoAlt?: string;
    errorNotReply?: string;
    errorChannel?: string;
    modChannel?: string;
    // unused toggles
    ai?: boolean;
    modRole?: string;
    leaderboard?: boolean;
    loserboard?: boolean;
  }
}

export const leaderboards: Data = {
  Native: {},
  Raiha: {},
  Loserboard: {},
  Milestones: {},
  Statistics: {},
  Configuration: {}
};

export const CLIENT = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

db.ref('/Leaderboard/Native').on("value", (data: DataSnapshot) => leaderboards.Native = data.val() as Leaderboard);
db.ref('/Leaderboard/Raiha').on("value", (data: DataSnapshot) => leaderboards.Raiha = data.val() as Leaderboard);
db.ref('/Leaderboard/Loserboard').on("value", (data: DataSnapshot) => leaderboards.Loserboard = data.val() as Leaderboard);
db.ref('/Leaderboard/Loserboard Milestones').on("value", (data: DataSnapshot) => leaderboards.Milestones = data.val() as Leaderboard);
db.ref('/Statistics').on("value", (data: DataSnapshot) => leaderboards.Statistics = data.val() as Statistics);
db.ref('/Configuration').on("value", (data: DataSnapshot) => leaderboards.Configuration = data.val() as Configuration);

// Set up listeners
CLIENT.on('ready', ready);
CLIENT.on('interactionCreate', interaction => interactionCreate(interaction));
CLIENT.on('messageCreate', message => messageCreate(message));
CLIENT.login(process.env.TOKEN);

process.on('uncaughtException', err => console.log(err))
process.on('unhandledRejection', err => console.log(err))