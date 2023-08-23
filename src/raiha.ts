/**
 * Raiha Accessibility Bot
 * (c) 2022 9volt
 */

import { Client, EmbedBuilder, GatewayIntentBits, TextChannel } from "discord.js";
import messageCreate from "./listeners/messageCreate";
import interactionCreate from "./listeners/interactionCreate";
import ready from "./listeners/ready";

require('dotenv').config();
var admin = require('firebase-admin');
var firebase = require('./firebase.json');

export const VERSION = "2.1.1";

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
  loserboardNotifier(data);
  leaderboards['Loserboard'] = data.val();
});
db.ref('/Statistics').on("value", function(data: {[key:string]:any}) {
  leaderboards['Statistics'] = data.val();
});
db.ref('/Configuration').on("value", function(data: {[key:string]:any}) {
  leaderboards['Configuration'] = data.val();
});

// Loserboard notifier
const loserboardNotifier = async (data: { [key: string]: any }) => {
  let incomingData = data.val();
  let currentData = leaderboards['Loserboard'];
  const chan: string = `${process.env.MOD_CHANNEL}`;

  for (let user of Object.keys(currentData)) {
    let ic = incomingData[user];
    if (ic && ic > currentData[user]) {
      // Check if mute threshold hit
      if (ic != 0 && (ic % 25 == 0)) {
        // Wait and see if it remains this way
        await new Promise(r => setTimeout(r, 30000));
        currentData = leaderboards['Loserboard'];
        if (ic <= currentData[user]) { // The board has gone up since, or remained the same
          // Notice zone
          const embed = new EmbedBuilder()
            .setTitle(`Loserboard Alert`)
            .setDescription(`Hello! User <@${user}>'s Loserboard score is now ${ic}.\nAn image mute may be warrented.`)
            .setColor(0xf4d7ff); //more red
          (client.channels.cache.get(chan) as TextChannel).send({ embeds: [embed] })
        }
      }
      // Check if warn threshold hit
      if (ic != 0 && ((ic + 5) % 25 == 0)) {
        // Wait and see if it remains this way
        await new Promise(r => setTimeout(r, 30000));
        currentData = leaderboards['Loserboard'];
        if (ic <= currentData[user]) {
          // Notice zone
          const embed = new EmbedBuilder()
            .setTitle(`Loserboard Alert`)
            .setDescription(`Hello! User <@${user}>'s Loserboard score is now ${ic}.\nThey should be warned that they are approaching an image mute.`)
            .setColor(0xf4d7ff); //more red
          (client.channels.cache.get(chan) as TextChannel).send({ embeds: [embed] })
        }
      }
    }
  }
};

// Set up listeners
ready(client);
interactionCreate(client, db, leaderboards);
messageCreate(client, db, leaderboards);

client.login(process.env.TOKEN);
