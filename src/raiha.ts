/**
 * Raiha Accessibility Bot
 * (c) 2022 9volt
 */

import { Client, Events, GatewayIntentBits } from "discord.js";
import messageCreate from "./listeners/messageCreate";
import interactionCreate from "./listeners/interactionCreate";
import ready from "./listeners/ready";
import { loserboardNotify } from "./actions/loserboardNotify.action";
import admin from 'firebase-admin'
import { AutoPunishment, AutoPunishmentLog, Configuration, Data, Leaderboard, Statistics, UserSettings } from './misc/types';
import { DataSnapshot } from '@firebase/database-types';
import { autoPunishmentChecker } from "./handlers/autoPunishmentChecker";
const firebase = require('../firebase.json');
require('dotenv').config();

export const VERSION = "3.1.5";

admin.initializeApp({
  credential: admin.credential.cert(firebase),
  databaseURL: process.env.DATABASE_URL
});

export const db = admin.database();

export const leaderboards: Data = {
  Native: {},
  Raiha: {},
  Loserboard: {},
  Statistics: {},
  Configuration: {},
  UserSettings: {},
  AutoPunishments: {},
  AutoPunishmentLogs: {}
} as Data;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});
export const CLIENT: Client = client;

db.ref('/Leaderboard/Native').on("value", (data: DataSnapshot) => leaderboards.Native = data.val() as Record<string, Leaderboard>);
db.ref('/Leaderboard/Raiha').on("value", (data: DataSnapshot) => leaderboards.Raiha = data.val() as Record<string, Leaderboard>);
db.ref('/Leaderboard/Loserboard').on("value", function (data: DataSnapshot) {
  const loserboard = data.val() as Record<string, Leaderboard>
  loserboardNotify(loserboard);
  leaderboards.Loserboard = loserboard;
});
db.ref('/Statistics').on("value", function (data: DataSnapshot) {
  leaderboards.Statistics = data.val() as Statistics;
});
db.ref('/Configuration').on("value", (data: DataSnapshot) => leaderboards.Configuration = data.val() as Record<string, Configuration>);
db.ref('/UserSettings').on("value", (data: DataSnapshot) => leaderboards.UserSettings = data.val() as Record<string, UserSettings>);
db.ref('/AutoPunishments').on("value", (data: DataSnapshot) => leaderboards.AutoPunishments = data.val() as Record<string, AutoPunishment>);
db.ref('/AutoPunishmentLogs').on("value", (data: DataSnapshot) => leaderboards.AutoPunishmentLogs = data.val() as Record<string, AutoPunishmentLog>);

// Set up listeners
client.once(Events.ClientReady, ready);
client.on(Events.InteractionCreate, interactionCreate);
client.on(Events.MessageCreate, messageCreate);

// Start punishment checker loop
autoPunishmentChecker();

client.login(process.env.TOKEN);
