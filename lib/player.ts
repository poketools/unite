export interface TeammateInfo {
  level: number;
  name: string;
  pokemon: string;
  score: number;
  kill: number;
  assist: number;
  interrupt: number;
  damageDealt: number;
  damageTaken: number;
  recovery: number;
}

export interface MatchInfo {
  // ISO8601 string with timezone from dayjs.
  time: string;

  result: string;
  allyScore: number;
  opponentScore: number;
  teamAlly: TeammateInfo[];
  teamOpponent: TeammateInfo[];
}

export interface PlayerInfo {
  id: string;
  level: number;
  cup: string;
  masterRank: number;
  recentRankedMatches: MatchInfo[];
}
