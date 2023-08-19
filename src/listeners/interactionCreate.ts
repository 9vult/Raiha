import { GuildMember, Interaction } from "discord.js";
import commands from '../commands';

export default (interaction: Interaction): void => {
  if (!interaction.isChatInputCommand() || !interaction.inGuild()) return;

  const { commandName, options, user, member } = interaction;
  if (!(member instanceof GuildMember)) return; // if commands need to be used outside a server remove this guard
  commands[commandName]?.(interaction, { commandName, options, user, member });
};
