
import { EmbedBuilder } from "discord.js";
import { autoPunishmentRemove } from "../actions/autoPunishmentRemove.action";
import { CLIENT, db, leaderboards } from "../raiha";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";

export async function autoPunishmentChecker() {
  setInterval(async () => {
    let currentTime = Date.now();
    for (let punishmentId in leaderboards.AutoPunishments) {
      let punishment = leaderboards.AutoPunishments[punishmentId];
      if (punishment.timeout < currentTime) {
        // Release the prisoner
        autoPunishmentRemove(punishment.guild, punishment.user);
        db.ref('/AutoPunishments').child(punishmentId).remove();

        const embed = new EmbedBuilder()
          .setTitle(`Auto Punishments`)
          .setDescription(`<@&${leaderboards.Configuration[punishment.guild].autoPunishmentRole}> has been removed from <@${punishment.user}>.`)
          .setColor(0xf4d7ff);
        const fetchChannel = CLIENT.channels.cache.get(leaderboards.Configuration[punishment.guild].modChannel);
        if (!fetchChannel?.isTextBased()) return;
        await fetchChannel.send({ embeds: [embed], allowedMentions: generateAllowedMentions() });
      }
    }
  }, 45 * 1000);
}