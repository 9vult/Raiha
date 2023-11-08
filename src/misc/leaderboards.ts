import { leaderboards } from '../raiha';
import { Leaderboard, SortedLeaderboard } from './types';

export function postRank(id: string, guild: string): string {
  const { Native, Raiha, Loserboard } = leaderboards;
  const [native, raiha, loser] = [Native, Raiha, Loserboard].map(leaderboardRecord => {
    const leaderboard = leaderboardRecord[guild];
    const value = leaderboard[id] ?? 0;
    return {
      value,
      rank: value ? Object.values(leaderboard).reduce((a, b) => a + (b > value ? 1 : 0), 0) + 1 : null,
    }
  })
  return `Leaderboard ranking for <@${id}>:\n` +
    `__**Native**__\n${native.rank ? `#${native.rank}` : 'Unranked'} with a count of ${native.value}.\n` +
    `__**Raiha**__\n${raiha.rank ? `#${raiha.rank}` : 'Unranked'} with a count of ${raiha.value}.\n` +
    `__**Loserboard**__\n${loser.rank ? `#${loser.rank}` : 'Unranked'} with a count of ${loser.value}.`;
}

export function postLeaderboard(guild: string, page: number): { text: string, footer: string } {
  const [nativeSorted, raihaSorted] = [sortLeaderboard(leaderboards.Native[guild]), sortLeaderboard(leaderboards.Raiha[guild])]
  return {
    text: `__**Native**__\n${generateText(nativeSorted, 0, page, 5)}\n` +
      `__**Raiha**__\n${generateText(raihaSorted, 0, page, 5)}`,
    footer: `So far, Raiha has served ${leaderboards.Statistics.Requests} requests.`
  };
}

export async function postLoserboard(guild: string, page: number) {
  return generateText(sortLeaderboard(leaderboards.Loserboard[guild]), 0, page, 10);
}

function generateText(leaderboard: SortedLeaderboard, startIndex: number, page: number, pageLength: number): string {
  const startPosition = startIndex + ((page - 1) * pageLength);
  if (leaderboard.length == 0 || leaderboard.length < startPosition) return 'No results';
  return leaderboard.slice(startIndex, startIndex + pageLength).reduce((a, { user, value }, i) =>
    a + `${i !== startPosition ? '\n' : ''}${i + 1}. <@${user}> - ${value}`, "")
}

export const sortLeaderboard = (leaderboard: Leaderboard): SortedLeaderboard =>
  Object.entries(leaderboard)
    .map(([user, value]) => ({ user, value }))
    .sort((a, b) => b.value - a.value);
