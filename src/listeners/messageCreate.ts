import { Message } from "discord.js";
import { handleMessage } from "../handlers/messageHandler";

export default async function (message: Message) {
  handleMessage((message as Message<true>));
};
