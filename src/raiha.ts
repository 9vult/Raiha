/**
 * Raiha Accessibility Bot
 * (c) 2022 9volt
 */

import { Client, GatewayIntentBits } from "discord.js";
import messageCreate from "./listeners/messageCreate";
import interactionCreate from "./listeners/interactionCreate";
import ready from "./listeners/ready";
import loserboardNotify from "./actions/loserboardNotify.action";
import admin from 'firebase-admin'
import { Data } from './misc/types';
import { DataSnapshot } from '@firebase/database-types';
const firebase = require('../firebase.json');
require('dotenv').config();


export const VERSION = "2.3.5";

export const db = admin.initializeApp({
  credential: admin.credential.cert(firebase),
  databaseURL: process.env.DATABASE_URL
}).database();

export const leaderboards = {
  Native: {},
  Raiha: {},
  Loserboard: {},
  Statistics: {},
  Configuration: {},
  UserSettings: {}
} as Data;

export const CLIENT = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

db.ref('/Leaderboard/Native').on("value", (data: DataSnapshot) => leaderboards.Native = data.val());
db.ref('/Leaderboard/Raiha').on("value", (data: DataSnapshot) => leaderboards.Raiha = data.val());
db.ref('/Leaderboard/Loserboard').on("value", (data: DataSnapshot) => {
  const loserboard = data.val();
  loserboardNotify(loserboard);
  leaderboards.Loserboard = loserboard;
});
db.ref('/Statistics').on("value", (data: DataSnapshot) => leaderboards.Statistics = data.val());
db.ref('/Configuration').on("value", (data: DataSnapshot) => leaderboards.Configuration = data.val());
db.ref('/UserSettings').on("value", (data: DataSnapshot) => leaderboards.UserSettings = data.val());

// Set up listeners
CLIENT.on('ready', ready);
CLIENT.on('interactionCreate', interactionCreate);
CLIENT.on('messageCreate', messageCreate);
CLIENT.login(process.env.TOKEN);
