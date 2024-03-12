import { EmbedBuilder } from "discord.js";
import { CLIENT } from "../raiha";

export async function sendDm(user: string, embed: EmbedBuilder) {
    await CLIENT.users.send(user, { embeds: [embed] });
}