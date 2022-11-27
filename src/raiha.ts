/**
 * Raiha Accessibility Bot
 * (c) 2022 9volt
 */

import { Client, GatewayIntentBits } from "discord.js";
import messageCreate from "./listeners/messageCreate";
import ready from "./listeners/ready";

require('dotenv').config();
var admin = require('firebase-admin');
var firebase = require('./firebase.json');

admin.initializeApp({
  credential: admin.credential.cert(firebase),
  databaseURL: process.env.DATABASE_URL
});

var db = admin.database();

var leaderboards: {[key:string]:any} = {
  Native: {},
  Raiha: {},
  Loserboard: {},
  Statistics: {}
};

db.ref('/Leaderboard/Native').on("value", function(data: {[key:string]:any}) {
  leaderboards['Native'] = data.val();
});
db.ref('/Leaderboard/Raiha').on("value", function(data: {[key:string]:any}) {
  leaderboards['Raiha'] = data.val();
});
db.ref('/Leaderboard/Loserboard').on("value", function(data: {[key:string]:any}) {
  leaderboards['Loserboard'] = data.val();
});
db.ref('/Statistics').on("value", function(data: {[key:string]:any}) {
  leaderboards['Statistics'] = data.val();
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Set up listeners
ready(client);
messageCreate(client, admin, db, leaderboards);

client.login(process.env.TOKEN);
