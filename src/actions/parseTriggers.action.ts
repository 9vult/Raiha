import { Message } from "discord.js";
import { NoTrigger, Trigger, TriggerOverride, TriggerType } from "../misc/types";
import { leaderboards } from "../raiha";

export default function parseTriggers(msg: Message<true>): Trigger {
  let lc = msg.content.toLowerCase();
  const triggers = /\b(r!|alt:|id:|!r|ts!|transcribe!|edit!|r\/|delete!)(?:\ (--|—)([A-Za-z]+)=([A-Za-z]+))?/ig;
  let match = lc.matchAll(triggers).next().value;
  if (!match) return NoTrigger;

  let rawTrigger: string = match[1];
  let oKey: string = match[3];
  let oValue: string = match[4];
  let position: number = match.index;

  if (disabled(msg, rawTrigger)) return NoTrigger;

  let type: TriggerType;
  let length: number;
  let override: TriggerOverride | undefined;
  let body: string;

  switch (rawTrigger) {
    case 'r!':
    case '!r':
    case 'alt:':
    case 'id:':
      type = TriggerType.ALT;
      break;
    case 'ts!':
    case 'transcribe!':
      type = TriggerType.TRANSCRIPTION;
      break;
    case 'r/':
    case 'edit!':
      type = TriggerType.EDIT;
      break;
    case 'delete!':
      type = TriggerType.DELETE;
      break;
    default:
      return NoTrigger;
  }

  if (!oKey || !oValue) {
    length = rawTrigger.length;
    override = undefined;
    body = msg.content.substring(position + rawTrigger.length).trim()
  } else {
    length = rawTrigger.length + oKey.length + oValue.length + 4; // 3: -- =
    override = { key: oKey, value: oValue },
    body = msg.content.substring(position + length).trim()
  }
  return {
    type,
    position,
    length,
    raw: rawTrigger,
    override,
    body
  }
}

function disabled(msg: Message<true>, key: string): boolean {
  const disabledTriggers = leaderboards.Configuration[msg.guild.id].disabledTriggers;
  if (!disabledTriggers || disabledTriggers.length <= 0) return false;
  if (disabledTriggers.indexOf(key) !== -1) return true;
  return false;
}
