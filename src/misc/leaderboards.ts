import { Attachment, Client, EmbedBuilder, Message, MessageMentionOptions } from "discord.js";

export const postRank = async (id: string, lbs: {[key:string]:any}) => {
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
      nativeHas = true;
      break;
    }
  }
  for (let obj of raihaS) {
    iRaiha++;
    if (obj[0] == id) {
      raihaVal = obj[1];
      raihaHas = true;
      break;
    }
  }
  for (let obj of loserS) {
    iLoser++;
    if (obj[0] == id) {
      loserVal = obj[1];
      if (loserVal != 0) loserHas = true;
      break;
    }
  }
  if (!nativeHas) iNative = 0;
  if (!raihaHas) iRaiha = 0;
  if (!loserHas) iLoser = 0;
  return `Leaderboard ranking for <@${id}>:\n__**Native**__\n${iNative != 0 ? '#' + (iNative-1) : 'Unranked'} with a count of ${nativeVal}.\n__**Raiha**__\n${iRaiha != 0 ? '#' + iRaiha : 'Unranked'} with a count of ${raihaVal}.\n__**Loserboard**__\n${iLoser != 0 ? '#' + (iLoser) : 'Unranked'} with a count of ${loserVal}.`;
}

export const postLeaderboard = async (lbs: {[key:string]:any}) => {
  const sorted = leaderboardSorter(lbs);
  const nativeS = sorted[0];
  const raihaS = sorted[1];
  const result = {
    text: `__**Native**__\n${nativeS.length > 1 ? '1. <@' + nativeS[1][0] + '> — ' + nativeS[1][1] + '\n' : 'Leaderboard Error'}${nativeS.length > 2 ? '2. <@' + nativeS[2][0] + '> — ' + nativeS[2][1] + '\n' : ''}${nativeS.length > 3 ? '3. <@' + nativeS[3][0] + '> — ' + nativeS[3][1] + '\n' : ''}${nativeS.length > 4 ? '4. <@' + nativeS[4][0] + '> — ' + nativeS[4][1] + '\n' : ''}${nativeS.length > 5 ? '5. <@' + nativeS[5][0] + '> — ' + nativeS[5][1] + '\n' : ''}\n__**Raiha**__\n${raihaS.length > 0 ? '1. <@' + raihaS[0][0] + '> — ' + raihaS[0][1] + '\n' : 'Leaderboard Error'}${raihaS.length > 1 ? '2. <@' + raihaS[1][0] + '> — ' + raihaS[1][1] + '\n' : ''}${raihaS.length > 2 ? '3. <@' + raihaS[2][0] + '> — ' + raihaS[2][1] + '\n' : ''}${raihaS.length > 3 ? '4. <@' + raihaS[3][0] + '> — ' + raihaS[3][1] + '\n' : ''}${raihaS.length > 4 ? '5. <@' + raihaS[4][0] + '> — ' + raihaS[4][1] + '\n' : ''}`,
    footer: `So far, Raiha has served ${lbs['Statistics']['Requests']} requests.`
  };
  return result;
}

export const postLoserboard = async (lbs: {[key:string]:any}) => {
  const sorted = leaderboardSorter(lbs);
  const loserS = sorted[2];
  return `${loserS.length > 0 ? '1. <@' + loserS[0][0] + '> - ' + loserS[0][1] + '\n' : 'Leaderboard Error'}${loserS.length > 1 ? '2. <@' + loserS[1][0] + '> - ' + loserS[1][1] + '\n' : ''}${loserS.length > 2 ? '3. <@' + loserS[2][0] + '> - ' + loserS[2][1] + '\n' : ''}${loserS.length > 3 ? '4. <@' + loserS[3][0] + '> - ' + loserS[3][1] + '\n' : ''}${loserS.length > 4 ? '5. <@' + loserS[4][0] + '> - ' + loserS[4][1] + '\n' : ''}${loserS.length > 5 ? '6. <@' + loserS[5][0] + '> - ' + loserS[5][1] + '\n' : ''}${loserS.length > 6 ? '7. <@' + loserS[6][0] + '> - ' + loserS[6][1] + '\n' : ''}${loserS.length > 7 ? '8. <@' + loserS[7][0] + '> - ' + loserS[7][1] + '\n' : ''}${loserS.length > 8 ? '9. <@' + loserS[8][0] + '> - ' + loserS[8][1] + '\n' : ''}${loserS.length > 9 ? '10. <@' + loserS[9][0] + '> - ' + loserS[9][1] + '\n' : ''}`;
}

export const leaderboardSorter = (lbs: {[key:string]:any}) => {
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
