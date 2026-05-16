// src/components/DiceOverlay.jsx
import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";

export default function DiceOverlay() {
  const [rollData, setRollData] = useState(null);
  const [displayNumber, setDisplayNumber] = useState(1);
  const [isFinal, setIsFinal] = useState(false);
  const lastRollIdRef = useRef("");

  useEffect(() => {
    const sessionRef = doc(db, "sessions", "famille_dnd");
    const unsub = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (data.active_roll && data.active_roll.id !== lastRollIdRef.current) {
          lastRollIdRef.current = data.active_roll.id;
          const currentRoll = data.active_roll;
          
          setRollData(currentRoll);
          setIsFinal(false);

          let maxFaces = parseInt(currentRoll.type.replace('d', '')) || 20;
          const interval = setInterval(() => {
            setDisplayNumber(Math.floor(Math.random() * maxFaces) + 1);
          }, 50);

          setTimeout(() => {
            clearInterval(interval);
            setDisplayNumber(currentRoll.result);
            setIsFinal(true);

            // 🛑 AUCUNE ÉCRITURE DANS FIREBASE ICI !
            // L'animation disparaît simplement après 3 secondes.
            setTimeout(() => {
              setRollData(null);
            }, 3000);

          }, 1500);
        }
      }
    });

    return () => unsub();
  }, []);

  return (
    <AnimatePresence>
      {rollData && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="dice-overlay-bg"
        >
          <div className="dice-container-2d">
            <h2 className="dice-roller-name" style={{ color: rollData.color }}>
              {rollData.roller} lance un {rollData.type}
            </h2>
            <motion.div 
              className="epic-2d-die"
              style={{ borderColor: rollData.color, boxShadow: isFinal ? `0 0 50px ${rollData.color}, inset 0 0 30px ${rollData.color}` : `0 0 10px ${rollData.color}` }}
              animate={isFinal ? { scale: [1, 1.3, 1], rotate: 0 } : { rotate: [0, 15, -15, 10, -10, 5, -5], scale: [1, 1.1, 1] }}
              transition={{ duration: isFinal ? 0.4 : 0.2, repeat: isFinal ? 0 : Infinity }}
            >
              <motion.span 
                key={displayNumber}
                initial={!isFinal ? { opacity: 0.5, y: -20 } : { scale: 0.5 }}
                animate={!isFinal ? { opacity: 1, y: 0 } : { scale: 1 }}
                className="dice-number"
                style={{ color: isFinal ? '#fff' : rollData.color }}
              >
                {displayNumber}
              </motion.span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}