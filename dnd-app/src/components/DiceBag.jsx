// src/components/DiceBag.jsx
import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, arrayUnion } from "firebase/firestore";
import { db } from '../firebase';

export default function DiceBag({ themeColor, playerName }) {
  const [isLocked, setIsLocked] = useState(true);
  const diceTypes = [4, 6, 8, 10, 12, 20, 100];

  useEffect(() => {
    const sessionRef = doc(db, "sessions", "famille_dnd");
    const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) setIsLocked(docSnap.data().dice_locked !== false);
    });
    return () => unsubscribe();
  }, []);

  const rollDice = async (maxFaces) => {
    const finalResult = Math.floor(Math.random() * maxFaces) + 1;
    const sessionRef = doc(db, "sessions", "famille_dnd");
    
    // 1. Déclenche l'animation
    await setDoc(sessionRef, { 
      active_roll: {
        id: Date.now().toString(),
        roller: playerName, color: themeColor, type: `d${maxFaces}`, result: finalResult 
      } 
    }, { merge: true });

    // 2. Écrit dans l'historique 1.5 seconde plus tard ! (Synchronisé avec l'animation)
    setTimeout(async () => {
      await setDoc(sessionRef, {
        history_log: arrayUnion({
          id: Date.now().toString(),
          text: `🎲 ${playerName} a lancé un d${maxFaces} et a obtenu : ${finalResult}`,
          color: themeColor
        })
      }, { merge: true });
    }, 1500);
  };

  return (
    <div className="dice-bag" style={{ padding: '15px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 className="placeholder-title" style={{ color: themeColor, fontSize: '1.1rem', margin: '0 0 15px 0' }}>Lancer les Dés</h3>
      {isLocked ? (
        <div style={{ padding: '15px', border: '2px dashed #374151', borderRadius: '8px', opacity: 0.5, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '2.5rem', display: 'block' }}>🔒</span>
          <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem' }}>Verrouillé par le MD</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', flex: 1 }}>
          {diceTypes.map((faces) => (
            <button 
              key={faces} className="epic-button-small" onClick={() => rollDice(faces)} 
              style={{ padding: '10px 5px', fontSize: '1rem', boxShadow: `0 0 10px ${themeColor}55`, border: `1px solid ${themeColor}` }}
            >
              d{faces}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}