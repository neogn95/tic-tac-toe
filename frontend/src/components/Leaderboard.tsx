import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import nakama from '../nakama';
import { Trophy, ArrowLeft, Medal } from 'lucide-react';
import { LeaderboardEntry } from '../types';

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setCurrentPage = useGameStore(state => state.setCurrentPage);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await nakama.getLeaderBoard();
      const formattedData = data.records.map((record: any, index: number) => ({
        username: record.username,
        score: record.score,
        rank: index + 1,
        metadata: {
          wins: parseInt(record.metadata.wins) || 0,
          draws: parseInt(record.metadata.draws) || 0,
          losses: parseInt(record.metadata.losses) || 0
        }
      }));
      setLeaderboard(formattedData);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setError('Failed to load leaderboard. Please try again later.');
      setLoading(false);
    }
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Medal className="text-yellow-400" size={24} />;
      case 2:
        return <Medal className="text-gray-400" size={24} />;
      case 3:
        return <Medal className="text-amber-600" size={24} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setCurrentPage('mainMenu')}
            className="text-gray-600 hover:text-gray-800 flex items-center"
          >
            <ArrowLeft size={24} className="mr-2" />
            Back to Menu
          </button>
          <h1 className="text-3xl font-bold text-center text-gray-800 flex items-center">
            <Trophy size={32} className="mr-3 text-purple-600" />
            Leaderboard
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">W/D/L</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((entry) => {
                  const totalGames = entry.metadata.wins + entry.metadata.draws + entry.metadata.losses;
                  const winRate = totalGames > 0 
                    ? ((entry.metadata.wins / totalGames) * 100).toFixed(1)
                    : '0.0';

                  return (
                    <tr key={entry.rank} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getMedalIcon(entry.rank)}
                          <span className="ml-2">{entry.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{entry.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{entry.score}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm">
                          <span className="text-green-600">{entry.metadata.wins}</span>
                          <span className="text-gray-500">/</span>
                          <span className="text-yellow-600">{entry.metadata.draws}</span>
                          <span className="text-gray-500">/</span>
                          <span className="text-red-600">{entry.metadata.losses}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">{winRate}%</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}