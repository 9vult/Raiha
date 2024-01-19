import { Message } from "discord.js";
import { ServerValue } from "firebase-admin/database";
import { db, CLIENT, leaderboards } from "../raiha";

export async function urlCheckLoserboard(guildId: string, msgAuthor: Message.author.id<true>) {
  let loser = leaderboards.Configuration[guildId].linkedImageLoserboard;
  if (loser) {
	db.ref(`/Leaderboard/Loserboard/${guildId}`).child(msgAuthor).set(ServerValue.increment(1));
  }
}