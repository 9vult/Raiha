import { GuildMember, Interaction } from "discord.js";
import commands from '../commands';
import { CLIENT, db, leaderboards } from '../raiha';

export default (interaction: Interaction): void => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, user, member } = interaction;
  if (!(member instanceof GuildMember)) return; // if commands need to be used outside a server remove this guard
  commands[commandName]?.(interaction, { commandName, options, user, member, client: CLIENT, db, leaderboards });
};
