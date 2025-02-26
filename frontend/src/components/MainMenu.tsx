import { useGameStore } from '../store';
import { Trophy, Swords, Clock } from 'lucide-react';

export function MainMenu() {
  const setCurrentPage = useGameStore(state => state.setCurrentPage);
  const setIsMatchmaking = useGameStore(state => state.setIsMatchmaking);
  const setFastGameMode = useGameStore(state => state.setFastGameMode);

  const handlePlay = (fastGameMode: boolean) => {
    setFastGameMode(fastGameMode);
    setIsMatchmaking(true);
    setCurrentPage('matchmaking');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">Main Menu</h1>
        
        <div className="space-y-10">
        <div className="grid grid-cols-1 gap-3">
        <button
              onClick={() => handlePlay(false)}
              className="w-full bg-indigo-600 text-white py-4 px-4 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-3"
            >
              <Swords size={24} />
              <div className="text-left">
                <span className="block font-semibold">Normal Mode</span>
                <span className="text-sm opacity-90">Classic tic-tac-toe experience</span>
              </div>
            </button>
            
            <button
              onClick={() => handlePlay(true)}
              className="w-full bg-orange-600 text-white py-4 px-4 rounded-md hover:bg-orange-700 transition-colors flex items-center justify-center space-x-3"
            >
              <Clock size={24} />
              <div className="text-left">
                <span className="block font-semibold">Blitz Mode</span>
                <span className="text-sm opacity-90">Fast-paced with 5s per move</span>
              </div>
            </button>
          </div>
          <button
            onClick={() => { setCurrentPage('leaderboard') }}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Trophy size={24} />
            <span>Leaderboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}