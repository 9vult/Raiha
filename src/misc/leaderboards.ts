import { Attachment, Client, EmbedBuilder, Message, MessageMentionOptions } from "discord.js";

export const postRank = async (id: string, lbs: { [key: string]: any }) => {
  const sorted = leaderboardSorter(lbs);
  const nativeS = sorted[0];
  const raihaS = sorted[1];
  const loserS = sorted[2];
  let iNative = 0;
  let iRaiha = 0;
  let iLoser = 0;
  let nativeVal = 0;
  let raihaVal = 0;
  let loserVal = 0;
  let nativeHas = false;
  let raihaHas = false;
  let loserHas = false;
  for (let obj of nativeS) {
    iNative++;
    if (obj[0] == id) {
      nativeVal = obj[1];
      nativeHas = (nativeVal !== 0);
      break;
    }
  }
  for (let obj of raihaS) {
    iRaiha++;
    if (obj[0] == id) {
      raihaVal = obj[1];
      raihaHas = (raihaVal !== 0);
      break;
    }
  }
  for (let obj of loserS) {
    iLoser++;
    if (obj[0] == id) {
      loserVal = obj[1];
      loserHas = (loserVal !== 0);
      break;
    }
  }
  if (!nativeHas) iNative = -1;
  if (!raihaHas) iRaiha = -1;
  if (!loserHas) iLoser = -1;
  return `Leaderboard ranking for <@${id}>:\n__**Native**__\n${iNative != -1 ? '#' + (iNative) : 'Unranked'} with a count of ${nativeVal}.\n__**Raiha**__\n${iRaiha != -1 ? '#' + iRaiha : 'Unranked'} with a count of ${raihaVal}.\n__**Loserboard**__\n${iLoser != -1 ? '#' + (iLoser) : 'Unranked'} with a count of ${loserVal}.`;
}

export const postLeaderboard = async (lbs: { [key: string]: any }, page: number): Promise<{ text: string, footer: string }> => {
  const sorted = leaderboardSorter(lbs);
  const nativeResult = generateText(sorted[0], 0, page, 5);
  const raihaResult = generateText(sorted[1], 0, page, 5);
  const result = {
    text: `__**Native**__\n${nativeResult}\n__**Raiha**__\n${raihaResult}`,
    footer: `So far, Raiha has served ${lbs['Statistics']['Requests']} requests.`
  };
  return result;
}

export const postLoserboard = async (lbs: { [key: string]: any }, page: number): Promise<string> => {
  const sorted = leaderboardSorter(lbs);
  const loserS = sorted[2];
  return generateText(loserS, 0, page, 10);
}

const generateText = (board: any[], startIndex: number, page: number, pageLength: number) => {
  let startPosition = startIndex + ((page - 1) * pageLength);
  let result: string = '';
  if (board.length == 0 || board.length < startPosition) {
    return 'No results';
  }
  for (let i = startPosition; i < startPosition + pageLength; i++) {

    if (i > board.length - 1) return result;
    result = `${result}${i !== startPosition ? '\n' : ''}${i + 1}. <@${board[i][0]}> - ${board[i][1]}`;
  }
  return result;
}

export const leaderboardSorter = (lbs: { [key: string]: any }) => {
  let nativeS: any[] = [];
  let raihaS: any[] = [];
  let loserS: any[] = [];

  for (var k in lbs['Native']) {
    nativeS.push([k, lbs['Native'][k]]);
  }
  for (var k in lbs['Raiha']) {
    raihaS.push([k, lbs['Raiha'][k]]);
  }
  for (var k in lbs['Loserboard']) {
    loserS.push([k, lbs['Loserboard'][k]]);
  }
  nativeS.sort((a, b) => { return b[1] - a[1]; });
  raihaS.sort((a, b) => { return b[1] - a[1]; });
  loserS.sort((a, b) => { return b[1] - a[1]; });

  return [nativeS, raihaS, loserS];
}
