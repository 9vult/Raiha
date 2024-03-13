import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";
import { db } from "../raiha";

export const UserSettingCmd = async (interaction: ChatInputCommandInteraction) => {
  await interaction.deferReply();
  const { options, user } = interaction;
  const specifiedSetting = options.getString('setting')!;
  const specifiedOption = options.getString('option')! == 'YES'

  let ref;
  switch (specifiedSetting) {
    case 'Reminder':
      ref = db.ref(`/UserSettings/${user.id}`).child('Reminder');
      ref.set(specifiedOption);
      break;
    case 'ActivationFailure':
      ref = db.ref(`/UserSettings/${user.id}`).child('ActivationFailure');
      ref.set(specifiedOption);
      break;
    case 'AutoMode':
      ref = db.ref(`/UserSettings/${user.id}`).child('AutoMode');
      ref.set(specifiedOption);
      break;
    default:
      break;
  }

  const embed = new EmbedBuilder()
    .setTitle(`Raiha User Settings`)
    .setDescription(`Set ${specifiedSetting} to ${specifiedOption}.`)
    .setColor(0xd797ff);
  await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions() });
  return;
}