import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState } from './types';

interface GameStore extends GameState {
  setCurrentPage: (page: GameState['currentPage']) => void;
  setIsMatchmaking: (isMatchmaking: boolean) => void;
  setUsername: (username: string) => void;
  setGameBoard: (board: number[]) => void;
  setCurrentPlayer: (currentPlayer: number) => void;
  setWinner: (winner: number | null) => void;
  setIsDraw: (isDraw: boolean) => void;
  setOppUsername: (username: string) => void;
  setDeviceId: (deviceId: string) => void;
  setUserId: (userId: string) => void;
  setSessionToken: (token: string) => void;
  setMatchId: (matchId: string | undefined) => void;
  setPlayerMark: (playerMark: string) => void;
  setDeadline: (deadline: number | null) => void;
  setTimerIds: (timerIds: number[]) => void;
  setFastGameMode: (fastGameMode: boolean) => void;
  resetGame: () => void;
}

const initialState: GameState = {
  currentPage: 'home',
  isMatchmaking: false,
  gameBoard: Array(9).fill(0),
  currentPlayer: 1,
  winner: null,
  isDraw: false,
  username: undefined,
  oppUsername: undefined,
  deviceId: undefined,
  userId: undefined,
  sessionToken: undefined,
  matchId: undefined,
  playerMark: undefined,
  deadline: null,
  timerIds: [],
  fastGameMode: undefined
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,
      setCurrentPage: (page) => set({ currentPage: page }),
      setIsMatchmaking: (isMatchmaking) => set({ isMatchmaking }),
      setUsername: (username) => set({ username }),
      setGameBoard: (board) => set({ gameBoard: board }),
      setCurrentPlayer: (player) => set({ currentPlayer: player }),
      setWinner: (winner) => set({ winner }),
      setIsDraw: (isDraw) => set({ isDraw }),
      setOppUsername: (username) => set({ oppUsername: username }),
      setDeviceId: (deviceId) => set({ deviceId }),
      setUserId: (userId) => set({ userId }),
      setSessionToken: (token) => set({ sessionToken: token }),
      setMatchId: (matchId) => set({ matchId: matchId }),
      setPlayerMark: (playerMark) => set({ playerMark }),
      setDeadline: (deadline: number | null) => set({ deadline: deadline }),
      setTimerIds: (timerIds: number[]) => set({ timerIds: timerIds }),
      setFastGameMode: (fastGameMode) => set({ fastGameMode }),
      resetGame: () => set({
        gameBoard: Array(9).fill(0),
        currentPlayer: 1,
        winner: null,
        isDraw: false
      })
    }),
    {
      name: 'game-storage'
    }
  )
);
