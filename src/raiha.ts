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

export const VERSION = "2.0.1";

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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

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

// Loserboard notifier
const loserboardNotifier = (data: {[key:string]:any}) => {
  let incoming = data.val();
    let current = leaderboards['Loserboard'];
    const chan: string = `${process.env.MOD_CHANNEL}`;

    for (let user of Object.keys(current)) {
      let ic = incoming[user];
      if (ic != undefined) {
        if (ic != current[user]) {
          // Their score changed to hit a threshold (time to mute)
          if (ic != 0 && (ic % 25 == 0)) {
            // Notice zone
            const embed = new EmbedBuilder()
              .setTitle(`Loserboard Alert`)
              .setDescription(`Hello! User <@${user}>'s Loserboard score is now ${ic}. You may want to perform an Image mute if they don't begin to alt their images.`)
              .setColor(0xf4d7ff); //more red
            (client.channels.cache.get(chan) as TextChannel).send({ embeds: [embed] })
          }
          // Their score changed to be 5 strikes from a threshold (time to warn)
          if (ic != 0 && ((ic+5) % 25 == 0)) {
            // Notice zone
            const embed = new EmbedBuilder()
              .setTitle(`Loserboard Alert`)
              .setDescription(`Hello! User <@${user}>'s Loserboard score is now ${ic}. You should warn them that they are approaching an image mute.`)
              .setColor(0xd797ff); //keep purple
            (client.channels.cache.get(chan) as TextChannel).send({ embeds: [embed] })
          }
        }
      }
    }
}

// Set up listeners
ready(client);
interactionCreate(client, admin, db, leaderboards);
messageCreate(client, admin, db, leaderboards);

client.login(process.env.TOKEN);
