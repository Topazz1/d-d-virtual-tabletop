import { useEffect, useState, useRef } from 'react';
import { doc, collection, onSnapshot } from "firebase/firestore";
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Map() {
  const [mapUrl, setMapUrl] = useState("");
  const [combatActive, setCombatActive] = useState(false);
  const [monsters, setMonsters] = useState([]);
  const [players, setPlayers] = useState([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [showCombatFlash, setShowCombatFlash] = useState(false);
  
  const backgroundMusicRef = useRef(null);
  const strikeSoundRef = useRef(null);

  const getMonsterImage = (name) => {
    if (name.includes("Gobelin")) return "/gobelin.png";
    if (name.includes("Loup")) return "/loup.png";
    if (name.includes("Klarg")) return "/gros-gobelin.png";
    return "/gobelin.png";
  };

  useEffect(() => {
    backgroundMusicRef.current = new Audio('/combat-music.mp3');
    backgroundMusicRef.current.loop = true;
    backgroundMusicRef.current.volume = 0.4;
    strikeSoundRef.current = new Audio('/combat.mp3');
    strikeSoundRef.current.volume = 0.8;

    let lastTrigger = 0;
    let isCombatActive = false;

    const sessionRef = doc(db, "sessions", "famille_dnd");
    const unsubSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMapUrl(data.current_map || "");
        setMonsters(data.combat_monsters || []);
        setTurnIndex(data.current_turn_index || 0);
        isCombatActive = data.combat_active === true;
        setCombatActive(isCombatActive);

        if (!isCombatActive) {
          backgroundMusicRef.current.pause();
          backgroundMusicRef.current.currentTime = 0;
        }

        if (data.combat_sound_trigger && data.combat_sound_trigger !== lastTrigger) {
          lastTrigger = data.combat_sound_trigger;
          if (isCombatActive) {
            backgroundMusicRef.current.pause();
            backgroundMusicRef.current.currentTime = 0;
            strikeSoundRef.current.currentTime = 0;
            strikeSoundRef.current.play().catch(e => console.warn("Audio bloqué", e));

            setShowCombatFlash(true);
            setTimeout(() => setShowCombatFlash(false), 2500);

            strikeSoundRef.current.onended = () => {
              if (isCombatActive) backgroundMusicRef.current.play().catch(e => console.warn("Audio", e));
            };
          }
        }
      }
    });

    const playersRef = collection(db, "sessions", "famille_dnd", "players");
    const unsubPlayers = onSnapshot(playersRef, (querySnapshot) => {
      const pList = [];
      querySnapshot.forEach((doc) => pList.push({ ...doc.data(), id: doc.id }));
      setPlayers(pList);
    });

    return () => {
      unsubSession(); unsubPlayers();
      if (backgroundMusicRef.current) backgroundMusicRef.current.pause();
      if (strikeSoundRef.current) strikeSoundRef.current.pause();
    };
  }, []);

  // Sécurisation : On n'affiche dans la timeline que ceux qui ont une initiative valide
  const timeline = [
    ...players.filter(p => p.initiative !== undefined && p.initiative !== null).map(p => ({ ...p, isPlayer: true, img: p.image })),
    ...monsters.filter(m => m.hp_current > 0 && m.initiative !== undefined && m.initiative !== null).map(m => ({ ...m, isPlayer: false, img: getMonsterImage(m.name), color: '#ef4444' }))
  ].sort((a, b) => b.initiative - a.initiative);

  return (
    <>
      <AnimatePresence>
        {showCombatFlash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1, 0.8] }}
            transition={{ duration: 2.5, times: [0, 0.1, 0.9, 1] }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, pointerEvents: 'none' }}
          >
            <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '12rem', color: '#ef4444', textShadow: '0 0 30px rgba(239, 68, 68, 0.8)', textTransform: 'uppercase', letterSpacing: '15px' }}>COMBAT</h1>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="map-placeholder" style={{ position: 'relative', height: "100%", width: "100%", background: "#111827", borderRadius: '8px', overflow: 'hidden' }}>
        
        {combatActive && timeline.length > 0 && (
          <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', gap: '10px', padding: '10px', overflowX: 'auto', zIndex: 60, borderBottom: '2px solid var(--gold)' }}>
            {timeline.map((entity, index) => {
              const isActiveTurn = index === turnIndex % timeline.length;
              return (
                <div key={entity.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 15px', borderRadius: '30px', background: isActiveTurn ? 'rgba(212, 175, 55, 0.3)' : 'rgba(31, 41, 55, 0.8)', border: `2px solid ${isActiveTurn ? 'var(--gold)' : entity.color}`, boxShadow: isActiveTurn ? '0 0 15px var(--gold)' : 'none', opacity: isActiveTurn ? 1 : 0.6, transition: 'all 0.3s' }}>
                  <img src={entity.img} alt={entity.name} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
                    <strong style={{ fontSize: '0.8rem', color: isActiveTurn ? 'white' : '#9ca3af', whiteSpace: 'nowrap' }}>{entity.isPlayer ? entity.playerName : entity.name}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--gold)' }}>Init: {entity.initiative}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mapUrl ? <img src={mapUrl} alt="Carte Tactique" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <div style={{ padding: "40px", textAlign: "center", margin: "auto", color: "white" }}><h2 className="placeholder-title">Carte Tactique</h2></div>}

        {combatActive && monsters.length > 0 && (
          <div style={{ position: 'absolute', bottom: '10px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap', background: 'linear-gradient(to top, rgba(0,0,0,0.98), transparent)', padding: '60px 20px 20px 20px', zIndex: 50 }}>
            {monsters.map(m => (
              <div key={m.id} style={{ background: m.hp_current > 0 ? 'rgba(31, 41, 55, 0.98)' : 'rgba(100, 0, 0, 0.6)', border: m.hp_current > 0 ? '3px solid #ef4444' : '3px dashed #6b7280', borderRadius: '12px', padding: '15px', textAlign: 'center', width: '220px', boxShadow: m.hp_current > 0 ? '0 0 25px rgba(239, 68, 68, 0.7)' : 'none', filter: m.hp_current > 0 ? 'none' : 'grayscale(100%)', transition: 'all 0.3s ease' }}>
                <img src={getMonsterImage(m.name)} alt={m.name} style={{ width: '160px', height: '160px', objectFit: 'contain', marginBottom: '10px' }} />
                <strong style={{ color: 'white', fontSize: '1.2rem', display: 'block', whiteSpace: 'nowrap' }}>{m.name}</strong>
                <div style={{ background: 'black', borderRadius: '10px', marginTop: '10px', padding: '6px' }}>
                  <span style={{ color: m.hp_current > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '1.4rem' }}>{m.hp_current} PV</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}