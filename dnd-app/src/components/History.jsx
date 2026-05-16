// src/components/History.jsx
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from '../firebase';

export default function History() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const sessionRef = doc(db, "sessions", "famille_dnd");
    const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().history_log) {
        // On récupère le tableau et on l'inverse pour avoir le message le plus récent en haut
        setLogs([...docSnap.data().history_log].reverse());
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="game-history">
      <h3 className="placeholder-title">Chroniques</h3>
      <div className="history-log">
        {logs.length === 0 ? (
          <p className="log-entry system-msg">La partie a commencé. En attente du destin...</p>
        ) : (
          logs.map((log) => (
            <p key={log.id} className="log-entry" style={{ color: log.color || '#fff', fontWeight: 'bold' }}>
              {log.text}
            </p>
          ))
        )}
      </div>
    </div>
  );
}