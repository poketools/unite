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

export interface TeammateCount {
  name: string;
  count: number;
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
  name: string;
  level: number;
  cup: string;
  masterRank: number;
  recentTeammates: TeammateCount[];
  recentRankedMatches: MatchInfo[];
}
