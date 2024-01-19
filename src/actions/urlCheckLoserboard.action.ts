import { Message } from "discord.js";
import { ServerValue } from "firebase-admin/database";
import { db, leaderboards } from "../raiha";

export async function urlCheckLoserboard(msg: Message<true>) {
  let loser = leaderboards.Configuration[msg.guild!.id].linkedImageLoserboard;
  if (loser) {
	db.ref(`/Leaderboard/Loserboard/${msg.guild!.id}`).child(msg.author.id).set(ServerValue.increment(1));
  }
}