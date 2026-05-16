import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from '../firebase';
import Map from '../components/Map';
import DiceBag from '../components/DiceBag';
import History from '../components/History';
import CharacterSheet from '../components/CharacterSheet';

export default function PlayerDashboard({ player }) {
  const [livePlayer, setLivePlayer] = useState(player);
  const [sessionData, setSessionData] = useState({});

  useEffect(() => {
    if (!player || !player.playerName) return;
    const playerRef = doc(db, "sessions", "famille_dnd", "players", player.playerName);
    const unsubPlayer = onSnapshot(playerRef, (docSnap) => {
      if (docSnap.exists()) setLivePlayer({ ...player, ...docSnap.data() });
    });

    const sessionRef = doc(db, "sessions", "famille_dnd");
    const unsubSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) setSessionData(docSnap.data());
    });

    return () => { unsubPlayer(); unsubSession(); };
  }, [player]);

  const handleRollInitiative = async () => {
    const dexScore = livePlayer.stats?.DEX || 10;
    const dexMod = Math.floor((dexScore - 10) / 2);
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + dexMod;

    // Déclenche l'animation
    await setDoc(doc(db, "sessions", "famille_dnd"), {
      active_roll: {
        id: Date.now().toString(),
        roller: livePlayer.playerName, color: livePlayer.color, type: "d20", result: roll
      }
    }, { merge: true });

    // Inscription dans la timeline et l'historique APRES l'animation (1.5s)
    setTimeout(async () => {
      await setDoc(doc(db, "sessions", "famille_dnd", "players", livePlayer.playerName), { initiative: total }, { merge: true });
      await setDoc(doc(db, "sessions", "famille_dnd"), {
        history_log: arrayUnion({
          id: Date.now().toString(),
          text: `⚡ ${livePlayer.playerName} a tiré son Initiative : ${total} (Dé: ${roll} + Dex: ${dexMod})`,
          color: livePlayer.color
        })
      }, { merge: true });
    }, 1500);
  };

  if (!livePlayer) return null;

  return (
    <div className="epic-dashboard" style={{ '--theme-color': livePlayer.color }}>
      <div className="dashboard-grid">
        <div className="left-panel">
          <div className="map-container epic-panel" style={{ position: 'relative' }}>
            <Map />
            {sessionData.combat_active && (livePlayer.initiative === undefined || livePlayer.initiative === null) && (
              <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100, textAlign: 'center' }}>
                <button 
                  onClick={handleRollInitiative} 
                  className="epic-button-large" 
                  style={{ background: '#ef4444', color: 'white', boxShadow: '0 0 30px #ef4444', fontSize: '1.5rem', padding: '20px 40px' }}
                >
                  ⚔️ Lancer mon Initiative !
                </button>
              </div>
            )}
          </div>
          <div className="bottom-left-container">
            <div className="dice-container epic-panel"><DiceBag themeColor={livePlayer.color} playerName={livePlayer.playerName} /></div>
            <div className="history-container epic-panel"><History /></div>
          </div>
        </div>
        <div className="right-panel epic-panel character-panel"><CharacterSheet player={livePlayer} /></div>
      </div>
    </div>
  );
}