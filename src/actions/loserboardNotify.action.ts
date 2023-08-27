import { EmbedBuilder, TextChannel } from "discord.js";
import { CLIENT } from "../raiha";

export const loserboardNotify = async (incoming: { [key: string]: any }, current: { [key: string]: any }, config: {[key:string]:any}) => {
  if (!current || !incoming) return;
  for (let server of Object.keys(current)) {
    let incomingServer = incoming[server];
    if (!incomingServer) continue;

    let serverMuteThreshold = config[server]['muteThreshold'];
    let serverEnableWarnings: boolean = config[server]['enableWarnings'];
    let serverModChannel = config[server]['modChannel'];
    if (serverMuteThreshold <= 0) continue;

    for (let user of Object.keys(current[server])) {
      let incomingUser = incoming[server][user];
      if (!incomingUser) continue;
      if (incomingUser <= current[server][user]) continue;

      if (incomingUser != 0 && (incomingUser % serverMuteThreshold == 0))
        muteNotify(serverModChannel, user, incomingUser);
      if (serverEnableWarnings && incomingUser != 0 && ((incomingUser + 5) % serverMuteThreshold == 0))
        warnNotify(serverModChannel, user, incomingUser);
    }
  }
}

const muteNotify = async (channel: string, user: string, value: number) => {
  const embed = new EmbedBuilder()
  .setTitle(`Loserboard Alert`)
  .setDescription(`Hello! User <@${user}>'s Loserboard score is now ${value}.\nAn image mute may be warranted.`)
  .setColor(0xf4d7ff);
  await (CLIENT.channels.cache.get(channel) as TextChannel).send({ embeds: [embed] })
}

const warnNotify = async (channel: string, user: string, value: number) => {
  const embed = new EmbedBuilder()
  .setTitle(`Loserboard Alert`)
  .setDescription(`Hello! User <@${user}>'s Loserboard score is now ${value}.\nThey should be warned that they are approaching an image mute.`)
  .setColor(0xf4d7ff);
  await (CLIENT.channels.cache.get(channel) as TextChannel).send({ embeds: [embed] })
}