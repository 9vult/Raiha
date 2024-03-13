import { ChatInputCommandInteraction, Interaction } from 'discord.js';
import { RankCmd } from '../commands/rank.cmd';
import { LeaderboardCmd } from '../commands/leaderboard.cmd';
import { LoserboardCmd } from '../commands/loserboard.cmd';
import { SetCmd } from '../commands/set.cmd';
import { LogsCmd } from '../commands/logs.cmd';
import { UserSettingCmd } from '../commands/usersetting.cmd';
import { HelpCmd } from '../commands/help.cmd';
import { WhyCmd } from '../commands/why.cmd';
import { AltRulesCmd } from '../commands/altrules.cmd';
import { AboutCmd } from '../commands/about.cmd';
import { DelLogCmd } from '../commands/dellog.cmd';

export default async function (interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.inCachedGuild()) return;

  const commandName = (interaction as ChatInputCommandInteraction).commandName;

  switch (commandName) {
    case 'rank':
      await RankCmd(interaction);
      break;
    case 'leaderboard':
      await LeaderboardCmd(interaction);
      break;
    case 'loserboard':
      await LoserboardCmd(interaction);
      break;
    case 'set':
      await SetCmd(interaction);
      break;
    case 'logs':
      await LogsCmd(interaction);
      break;
    case 'usersetting':
      await UserSettingCmd(interaction);
      break;
    case 'help':
      await HelpCmd(interaction);
      break;
    case 'why':
      await WhyCmd(interaction);
      break;
    case 'altrules':
      await AltRulesCmd(interaction);
      break;
    case 'about':
      await AboutCmd(interaction);
      break;
    case 'dellog':
      await DelLogCmd(interaction);
      break;
  }
};
