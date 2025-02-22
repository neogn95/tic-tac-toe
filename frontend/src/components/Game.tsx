/* eslint-disable no-debugger */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { useGameStore } from "../store";
import nakama from "../nakama";

export function Game() {
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const gameBoard = useGameStore((state) => state.gameBoard);
  const currentPlayer = useGameStore((state) => state.currentPlayer);
  const winner = useGameStore((state) => state.winner);
  const isDraw = useGameStore((state) => state.isDraw);
  const oppUsername = useGameStore((state) => state.oppUsername);
  const username = useGameStore((state) => state.username);
  const userId = useGameStore((state) => state.userId);
  const playerMark = useGameStore((state) => state.playerMark);
  const setPlayerMark = useGameStore((state) => state.setPlayerMark);
  const setGameBoard = useGameStore((state) => state.setGameBoard);
  const setCurrentPlayer = useGameStore((state) => state.setCurrentPlayer);
  const setWinner = useGameStore((state) => state.setWinner);
  const setIsDraw = useGameStore((state) => state.setIsDraw);
  const setOppUsername = useGameStore((state) => state.setOppUsername);
  const setCurrentPage = useGameStore((state) => state.setCurrentPage);
  const timeToTransition = 3000;

  const resetGameBoard = () => {
    setGameBoard([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    setWinner(null);
    setIsDraw(false);
  };

  useEffect(() => {
    const checkSession = async () => {
      await nakama.isSessionExpired();
    };
    checkSession();
    getGameStatus();

    setupNakamaListeners();
    
    return () => {
      if (nakama.socket) {
        nakama.socket.onmatchdata = null;
        nakama.socket.onmatchdata = null;
        nakama.socket.onmatchpresence = null;
      }
      if (activeTimerRef.current) {
        clearInterval(activeTimerRef.current);
      }
    };
  }, []);

  const activeTimerRef = useRef<number | null>(null);

  const startCountdown = (deadline: number) => {
    if (activeTimerRef.current) {
      clearInterval(activeTimerRef.current);
      activeTimerRef.current = null;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const timeLeft = deadline * 1000 - now;

      if (timeLeft > 0) {
        setRemainingTime(Math.floor(timeLeft / 1000));
      } else {
        setRemainingTime(0);
        if (activeTimerRef.current) {
          clearInterval(activeTimerRef.current);
          activeTimerRef.current = null;
        }
      }
    };

    updateTimer();
    activeTimerRef.current = window.setInterval(updateTimer, 1000);
  };

  const setupNakamaListeners = () => {
    if (!nakama.socket) return;

    nakama.socket.onmatchdata = (result: any) => {
      const jsonString = new TextDecoder().decode(result.data);
      const json = jsonString ? JSON.parse(jsonString) : "";
      let deadline = null;

      switch (result.op_code) {
        case 1:
          handlePlayerTurn(json);
          deadline = json.deadline;
          break;
        case 2:
          console.log(`json.mark: ${json.mark}`);
          setGameBoard(json.board);
          setCurrentPlayer(json.mark); 
          deadline = json.deadline;
          break;
        case 3:
          setGameBoard(json.board);
          handleGameEnd(json);
          break;
        case 6:
          // handleOpponentLeft();
          break;
      }

      const prevDeadline = useGameStore.getState().deadline;
      if (deadline && deadline !== prevDeadline) {
        useGameStore.setState({ deadline: deadline });
        startCountdown(deadline);
      }
    };

    nakama.socket.onmatchpresence = (presence: any) => {
      if (presence && presence.joins && presence.joins.length > 0) {
        setOppUsername(presence.joins[0].username);
      }
    };
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(remainingSeconds).padStart(2, "0");
    return `${formattedMinutes}:${formattedSeconds}`;
  };

  const handlePlayerTurn = (data: any) => {
    debugger;
    if (!userId || !username || !oppUsername) return;

    // Set player marks
    if (data.marks && data.marks[userId]) {
      const playerMarkValue = data.marks[userId];
      setPlayerMark(playerMarkValue === 1 ? "X" : "O");
    }

    // Set current player
    if (data.mark !== undefined) {
      setCurrentPlayer(data.mark);
    }
  };

  const handleGameEnd = (data: any) => {
    if (data.winner) {
      setWinner(data.winner);
    } else {
      setIsDraw(true);
    }

    // Stop the timer once match is over
    if (activeTimerRef.current) {
      clearInterval(activeTimerRef.current);
      activeTimerRef.current = null;
    }

    // Delay navigation to leaderboard to allow updates
    setTimeout(() => {
      setCurrentPage("leaderboard");
      resetGameBoard();
    }, timeToTransition);
  };

  // const handleOpponentLeft = () => {
  //   setWinner(currentPlayer); // Current player wins if opponent leaves
  // };

  const handleCellClick = async (index: number) => {
    if (gameBoard[index] === 0 && !winner && !isDraw) {
      try {
        await nakama.makeMove(index);
      } catch (err) {
        console.error("Failed to make move:", err);
      }
    }
  };

  const getCellContent = (value: number) => {
    if (value === 1) return "X";
    if (value === 2) return "O";
    return "";
  };

  const getGameStatus = () => {
    if (winner) {
      const playerNumber = playerMark === 'X' ? 1 : 2;
      return winner === playerNumber ? 'You won!' : 'Opponent won!';
    }

    if (isDraw) {
      return "It's a draw!";
    }

    const isMyTurn = 
      (playerMark === 'X' && currentPlayer === 1) || 
      (playerMark === 'O' && currentPlayer === 2);
    
    return isMyTurn ? 'Your turn' : "Opponent's turn";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {getGameStatus()}
          </h2>
          {remainingTime !== null && (
            <div className="text-xl font-semibold text-blue-600">
              Time remaining: {formatTime(remainingTime)}
            </div>
          )}
          <div className="flex justify-between mt-4 text-gray-600">
            <div>
              <p>{username} (You)</p>
              <p className="font-bold text-gray-800">
                {playerMark === "X" ? "X" : "O"}
              </p>
            </div>

            {oppUsername && (
              <div>
                <p>{oppUsername}</p>
                <p className="font-bold text-gray-800">
                  {playerMark === "X" ? "O" : "X"}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {gameBoard.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              className="w-full aspect-square bg-gray-100 rounded-lg text-4xl font-bold flex items-center justify-center hover:bg-gray-200 transition-colors"
              disabled={cell !== 0 || winner !== null || isDraw}
            >
              {getCellContent(cell)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
