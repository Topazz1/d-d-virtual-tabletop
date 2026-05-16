import { useState } from 'react';
import Login from './pages/Login';
import PlayerDashboard from './pages/PlayerDashboard';
import MasterDashboard from './pages/MasterDashboard';
import DiceOverlay from './components/DiceOverlay'; // N'oublie pas l'import !

function App() {
  const [currentPlayer, setCurrentPlayer] = useState(null);

  return (
    <>
      {!currentPlayer ? (
        <Login onLogin={(data) => setCurrentPlayer(data)} />
      ) : currentPlayer.playerName === "MD_Tom" ? (
        <MasterDashboard />
      ) : (
        <PlayerDashboard player={currentPlayer} />
      )}
      
      {/* La couche invisible 3D qui englobe tout l'écran */}
      <DiceOverlay currentUser={currentPlayer} />
    </>
  );
}

export default App;