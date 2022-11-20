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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Set up listeners
ready(client);
messageCreate(client, db);

client.login(process.env.TOKEN);
