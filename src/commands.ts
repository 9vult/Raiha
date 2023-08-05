import { ChatInputCommandInteraction, Client, CommandInteractionOptionResolver, GuildMember, User } from 'discord.js';
import { Database } from '@firebase/database-types';
import rank from './commands/rank';
import leaderboard from './commands/leaderboard';
import loserboard from './commands/loserboard';
import deleteAltMessage from './commands/deleteAltMessage';
import set from './commands/set';
import showEmbed from './commands/showEmbed';

export default {
    rank,
    leaderboard,
    loserboard,
    deleteAltMessage,
    set,
    help: showEmbed,
    why: showEmbed,
    about: showEmbed
} as { [key: string]: (interaction: ChatInputCommandInteraction, options?: OptionalCommandArguments) => void }

export interface OptionalCommandArguments {
    commandName: string;
    options: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>;
    user: User;
    member: GuildMember
}