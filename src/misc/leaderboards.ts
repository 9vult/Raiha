import { Leaderboard, SortedLeaderboard, leaderboards } from '../raiha';

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

function getSortedLeaderboard(leaderboard: Leaderboard): SortedLeaderboard {
  return Object.entries(leaderboard)
    .map(([user, value]) => ({ user, value }))
    .sort((a, b) => b.value - a.value);
}