export interface GameState {
  currentPage: 'home' | 'mainMenu' | 'matchmaking' | 'game' | 'leaderboard';
  username?: string;
  isMatchmaking: boolean;
  gameBoard: Array<number>;
  currentPlayer: number;
  winner: number | null;
  isDraw: boolean;
  oppUsername?: string;
  deviceId?: string;
  userId?: string;
  matchId?: string | undefined;
  sessionToken?: string;
  playerMark?: string;
  deadline?: number | null;
  timerIds?: number[];
  fastGameMode?: boolean;
}

export interface LeaderboardEntry {
  username: string;
  score: number;
  rank: number;
  metadata: {
    wins: number;
    draws: number;
    losses: number;
  };
}
