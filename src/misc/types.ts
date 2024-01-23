export type Leaderboard = Record<string, number>;
export type SortedLeaderboard = { user: string, value: number }[];

export interface Statistics {
  Requests: number
}

export interface Configuration {
  ai: boolean
  altrules: "default" | string
  enableWarnings: boolean
  errorChannel: string
  errorMismatch: "default" | string
  errorNoAlt: "default" | string
  errorNotReply: "default" | string
  greenThreshold: number
  leaderboard: boolean
  loserboard: boolean
  modChannel: string
  modRole: string
  muteThreshold: 0 | number
  specialWarnThresholds: number[],
  placeInMessageBodyMode: "off" | string,
  disabledTriggers: string[] | undefined,
  openai: boolean,
  autoModeOptOut: boolean,
  linkedImageLoserboard: boolean
}

export interface UserSettings {
  Reminder: boolean,
  ActivationFailure: boolean,
  AutoMode: boolean
} 

export interface Data {
  Native: Record<string, Leaderboard>
  Raiha: Record<string, Leaderboard>
  Loserboard: Record<string, Leaderboard>
  Statistics: Statistics
  Configuration: Record<string, Configuration>
  UserSettings: Record<string, UserSettings>
}

export interface AiResult {
  desc: string,
  ocr: string
}

export interface Trigger {
  type: TriggerType,
  position: number,
  length: number,
  raw: string | undefined,
  override: TriggerOverride | undefined,
  body: string | undefined
}

export interface TriggerOverride {
  key: string,
  value: string
}

export enum TriggerType {
  NONE,
  ALT,
  TRANSCRIPTION,
  EDIT,
  DELETE
}

export const NoTrigger: Trigger = {
  type: TriggerType.NONE,
  position: -1,
  length: -1,
  raw: undefined,
  override: undefined,
  body: undefined
}