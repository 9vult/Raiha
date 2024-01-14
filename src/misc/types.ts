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
  autoModeOptOut: boolean
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