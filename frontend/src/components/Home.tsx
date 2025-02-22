import { useState } from 'react';
import { useGameStore } from '../store';
import nakama from '../nakama';
import { ArrowRight } from 'lucide-react';
import ErrorDisplay from './Error'

export function Home() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const setCurrentPage = useGameStore(state => state.setCurrentPage);

  const handleContinue = async () => {
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    try {
      await nakama.authenticate(username);
      setCurrentPage('mainMenu');
    } catch (err: any) {
      if(err && err.status == 409){
        setError('User name already exists!');
        console.log(err);
      }
      else
        setError('Failed to authenticate. Please try again.' + err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Welcome to Tic Tac Toe</h1>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Enter your username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Username"
            />
          </div>
          
          <ErrorDisplay error={error} />

          <button
            onClick={handleContinue}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
          >
            <span>Continue</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
