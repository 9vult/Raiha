/**
 * Raiha Accessibility Bot
 * (c) 2022 9volt
 */

import { Client, EmbedBuilder, GatewayIntentBits, TextChannel } from "discord.js";
import messageCreate from "./listeners/messageCreate";
import interactionCreate from "./listeners/interactionCreate";
import ready from "./listeners/ready";
import { loserboardNotify } from "./actions/loserboardNotify.action";

require('dotenv').config();
var admin = require('firebase-admin');
var firebase = require('./firebase.json');

export const VERSION = "2.3.5";

admin.initializeApp({
  credential: admin.credential.cert(firebase),
  databaseURL: process.env.DATABASE_URL
});

var db = admin.database();

var leaderboards: {[key:string]:any} = {
  Native: {},
  Raiha: {},
  Loserboard: {},
  Statistics: {},
  Configuration: {}
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});
export const CLIENT: Client = client;

db.ref('/Leaderboard/Native').on("value", function(data: {[key:string]:any}) {
  leaderboards['Native'] = data.val();
});
db.ref('/Leaderboard/Raiha').on("value", function(data: {[key:string]:any}) {
  leaderboards['Raiha'] = data.val();
});
db.ref('/Leaderboard/Loserboard').on("value", function(data: {[key:string]:any}) {
  loserboardNotify(data.val(), leaderboards);
  leaderboards['Loserboard'] = data.val();
});
db.ref('/Statistics').on("value", function(data: {[key:string]:any}) {
  leaderboards['Statistics'] = data.val();
});
db.ref('/Configuration').on("value", function(data: {[key:string]:any}) {
  leaderboards['Configuration'] = data.val();
});
db.ref('/UserSettings').on("value", function(data: {[key:string]:any}) {
  leaderboards['UserSettings'] = data.val();
});

// Set up listeners
ready(client);
interactionCreate(client, db, leaderboards);
messageCreate(client, db, leaderboards);

client.login(process.env.TOKEN);
