import { useEffect } from 'react';
import { useGameStore } from './store';
import { Home } from './components/Home';
import { MainMenu } from './components/MainMenu';
import { Matchmaking } from './components/Matchmaking';
import { Game } from './components/Game';
import nakama from './nakama';
import { Leaderboard } from './components/Leaderboard';

function App() {
  const currentPage = useGameStore(state => state.currentPage);

  useEffect(() => {
    const checkSession = async () => {
      await nakama.isSessionExpired();
    };
    checkSession();
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'mainMenu':
        return <MainMenu />;
      case 'matchmaking':
        return <Matchmaking />;
      case 'game':
        return <Game />;
      case 'leaderboard':
        return <Leaderboard />
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {renderPage()}
    </div>
  );
}

export default App;