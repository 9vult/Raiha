import { EmbedBuilder, TextChannel } from "discord.js";
import { CLIENT } from "../raiha";

export const sendError = async (config: {[key:string]:any}, guildId: string, errorTitle: string, errorBody: string, authorId: string|number, url: string) => {
  let chan = config[guildId!]['errorChannel'];
  // console.log(CLIENT);
  const embed = new EmbedBuilder()
    .setTitle(`Error: ${errorTitle}`)
    .setDescription(`${errorBody}\nAuthor ${authorId}\nURL ${url}`)
    .setColor(0xf4d7ff);
    await (CLIENT.channels.cache.get(chan) as TextChannel).send({ embeds: [embed] })
}