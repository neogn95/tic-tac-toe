import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store';
import nakama from '../nakama';
import { Loader2, X } from 'lucide-react';
import ErrorDisplay from './Error'

export function Matchmaking() {
  const setCurrentPage = useGameStore(state => state.setCurrentPage);
  const setIsMatchmaking = useGameStore(state => state.setIsMatchmaking);
  const [error, setError] = useState('');
  const matchStarted = useRef(false);

  useEffect(() => {
    if (!matchStarted.current) {
      matchStarted.current = true;
      startMatchmaking();
    }
  });

  const startMatchmaking = async () => {
    try {
      const opponents = await nakama.joinOrCreateMatch();
      debugger;
      if (opponents) {
        setCurrentPage('game');
      }

      nakama.socket.onmatchpresence = (presence:any) => {
        if (presence) {
          if (presence.joins) {
            const store = useGameStore.getState();
            const currentUserId = store.userId;
            const connectedOpponents = presence.joins.filter((presence:any) => {
              return presence.user_id != currentUserId;
            });
  
            if (connectedOpponents && connectedOpponents.length > 0) {
              store.setOppUsername(connectedOpponents[0].username);
              setCurrentPage('game');
            }
          }
        }
      }
    } catch (err) {
      console.error('Matchmaking failed:', err);
      setError("Matchmaking failed")
      setIsMatchmaking(false);
      setCurrentPage('mainMenu');
    }
  };

  const handleCancel = () => {
    setIsMatchmaking(false);
    setCurrentPage('mainMenu');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <Loader2 size={48} className="animate-spin mx-auto text-indigo-600" />
        </div>
        
        <h2 className="text-2xl font-semibold mb-4">Finding a match...</h2>
        <p className="text-gray-600 mb-8">Please wait while we connect you with another player</p>
        
        <button
          onClick={handleCancel}
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
        >
          <X size={20} className="mr-2" />
          Cancel
        </button>
        <ErrorDisplay error={error} />
      </div>
    </div>
  );
}