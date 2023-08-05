import { Leaderboard, SortedLeaderboard, leaderboards } from '../raiha';

export async function postRank(id: string) {
  const { Native, Raiha, Loserboard } = leaderboards;
  const [native, raiha, loser] = [Native, Raiha, Loserboard].map(leaderboard => {
    const value = leaderboard[id] ?? 0;
    const rankValues = Object.values(leaderboard);
    return {
      value,
      rank: value ? rankValues.reduce((a, b) => a + (b > value ? 1 : 0), 0) + 1 : null,
      total: rankValues.length
    }
  })
  return `Leaderboard ranking for <@${id}>:\n` +
    `__**Native**__\n${native.rank ? `#${native.rank}/${native.total}` : 'Unranked'} with a count of ${native.value}.\n` +
    `__**Raiha**__\n${raiha.rank ? `#${raiha.rank}/${raiha.total}` : 'Unranked'} with a count of ${raiha.value}.\n` +
    `__**Loserboard**__\n${loser.rank ? `#${loser.rank}/${loser.total}` : 'Unranked'} with a count of ${loser.value}.`;
}

export async function postLeaderboard(): Promise<Array<{ text: string, footer: string }>> {
  const { Native, Raiha, Statistics: { Requests } } = leaderboards;
  const [native, raiha] = [getSortedLeaderboard(Native), getSortedLeaderboard(Raiha)]
    .map(leaderboard => getText(leaderboard, 5));

  const embedContents = Array.from({ length: Math.max(native.length, raiha.length) }, (_, index) => ({
    text: `__**Native**__\n${native[index] ?? "N/A"}\n__**Raiha**__\n${raiha[index] ?? "N/A"}`,
    footer: `So far, Raiha has served ${Requests} requests.`
  }));
  return embedContents;
}

export async function postLoserboard(): Promise<string[]> {
  const loserS = getSortedLeaderboard(leaderboards.Loserboard);
  return getText(loserS, 10);
}

function getText(board: SortedLeaderboard, pageLength: number): string[] {
  const results = [];
  for (let i = 0; i < board.length; i += pageLength) {
    const selectedGroup = board.slice(i, i + pageLength)
    results.push(selectedGroup.reduce((a, b, j) =>
      a + `${a ? '\n' : ''}${i + j + 1}. <@${b.user}> - ${b.value}`
      , ""))
  }
  return results.length ? results : ["No results."];
}

export function getSortedLeaderboard(leaderboard: Leaderboard): SortedLeaderboard {
  return Object.entries(leaderboard)
    .map(([user, value]) => ({ user, value }))
    .sort((a, b) => b.value - a.value);
}