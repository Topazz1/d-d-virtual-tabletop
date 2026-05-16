import { useEffect, useState } from 'react';
import { doc, collection, onSnapshot, setDoc, deleteDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from '../firebase';
import Map from '../components/Map';

export default function MasterDashboard() {
  const [players, setPlayers] = useState([]);
  const [diceLocked, setDiceLocked] = useState(true);
  const [sessionData, setSessionData] = useState({});
  const [monsterQuantities, setMonsterQuantities] = useState({ gobelin: 0, loup: 0, klarg: 0 });
  const [secretLogs, setSecretLogs] = useState([]);

  const monsterTemplates = {
    gobelin: { name: "Gobelin", hp_max: 7, ac: 15, dex: 2, info: "CA 15 | PV 7 | +4 Atk" },
    loup: { name: "Loup", hp_max: 11, ac: 13, dex: 2, info: "CA 13 | PV 11 | +4 Atk" },
    klarg: { name: "Klarg (Chef)", hp_max: 27, ac: 16, dex: 2, info: "CA 16 | PV 27 | +4 Atk" }
  };

  useEffect(() => {
    const sessionRef = doc(db, "sessions", "famille_dnd");
    const unsubSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        setSessionData(docSnap.data());
        setDiceLocked(docSnap.data().dice_locked !== false);
      }
    });

    const playersRef = collection(db, "sessions", "famille_dnd", "players");
    const unsubPlayers = onSnapshot(playersRef, (querySnapshot) => {
      const pList = [];
      querySnapshot.forEach((doc) => pList.push({ ...doc.data(), id: doc.id }));
      setPlayers(pList);
    });
    return () => { unsubSession(); unsubPlayers(); };
  }, []);

  const handleSelectMap = async (mapPath) => await setDoc(doc(db, "sessions", "famille_dnd"), { current_map: mapPath }, { merge: true });
  const handleToggleDice = async () => await setDoc(doc(db, "sessions", "famille_dnd"), { dice_locked: !diceLocked }, { merge: true });
  const handleClearHistory = async () => { if(window.confirm("Vider l'historique public ?")) await setDoc(doc(db, "sessions", "famille_dnd"), { history_log: [] }, { merge: true }); };
  const handleKickPlayer = async (playerId) => { if(window.confirm("Expulser ?")) await deleteDoc(doc(db, "sessions", "famille_dnd", "players", playerId)); };
  const handlePlayerHP = async (playerId, currentHp, change) => await setDoc(doc(db, "sessions", "famille_dnd", "players", playerId), { hp_current: Math.max(0, currentHp + change) }, { merge: true });
  const updateQuantity = (type, amount) => setMonsterQuantities(prev => ({ ...prev, [type]: Math.max(0, prev[type] + amount) }));

  const handleSecretRoll = (faces) => {
    const roll = Math.floor(Math.random() * faces) + 1;
    setSecretLogs(prev => [{ id: Date.now(), text: `Secret d${faces} : ${roll}` }, ...prev]);
  };

  // ⚡ INIT DES MONSTRES (Réparée et ultra-robuste)
  const handleMonsterInit = async (monsterId, monsterName, dexMod) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + dexMod;
    
    // Déclenche le visuel chez tout le monde
    await setDoc(doc(db, "sessions", "famille_dnd"), { 
      active_roll: { id: Date.now().toString(), roller: monsterName, color: "#eab308", type: "d20", result: roll }
    }, { merge: true });

    // Enregistre 1.5s plus tard avec des données fraîches
    setTimeout(async () => {
      const snap = await getDoc(doc(db, "sessions", "famille_dnd"));
      const currentMonsters = snap.data()?.combat_monsters || [];
      const updatedMonsters = currentMonsters.map(m => m.id === monsterId ? { ...m, initiative: total } : m);
      
      await setDoc(doc(db, "sessions", "famille_dnd"), { 
        combat_monsters: updatedMonsters,
        history_log: arrayUnion({ id: Date.now().toString(), text: `⚡ ${monsterName} a tiré son Initiative : ${total} (Dé: ${roll} + Dex: ${dexMod})`, color: "#eab308" })
      }, { merge: true });
    }, 1500);
  };

  // ⚔️ JET D'ATTAQUE DES MONSTRES (Réparé)
  const handleMonsterRoll = async (monsterName) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    await setDoc(doc(db, "sessions", "famille_dnd"), { 
      active_roll: { id: Date.now().toString(), roller: monsterName, color: "#ef4444", type: "d20", result: roll } 
    }, { merge: true });

    setTimeout(async () => {
      await setDoc(doc(db, "sessions", "famille_dnd"), {
        history_log: arrayUnion({ id: Date.now().toString(), text: `🎲 ${monsterName} a attaqué (d20) et a obtenu : ${roll}`, color: "#ef4444" })
      }, { merge: true });
    }, 1500);
  };

  const handleStartCombat = async () => {
    let generatedMonsters = [];
    let summaryText = [];
    Object.entries(monsterQuantities).forEach(([key, qty]) => {
      if (qty > 0) {
        summaryText.push(`${monsterTemplates[key].name} x${qty}`);
        for(let i=0; i<qty; i++) {
          generatedMonsters.push({
            id: `${key}_${Date.now()}_${i}`, name: `${monsterTemplates[key].name} ${i+1}`,
            hp_max: monsterTemplates[key].hp_max, hp_current: monsterTemplates[key].hp_max, initiative: null, ac: monsterTemplates[key].ac, dex: monsterTemplates[key].dex
          });
        }
      }
    });
    if (generatedMonsters.length === 0) return alert("Sélectionnez au moins un monstre !");
    await setDoc(doc(db, "sessions", "famille_dnd"), { combat_active: true, combat_monsters: generatedMonsters, combat_sound_trigger: Date.now(), current_turn_index: 0, history_log: arrayUnion({ id: Date.now().toString(), text: `⚔️ EMBUSCADE ! Vous êtes attaqués par : ${summaryText.join(', ')} !`, color: '#ef4444' }) }, { merge: true });
  };

  const handleStopCombat = async () => {
    if(window.confirm("Mettre fin au combat ?")) {
      await setDoc(doc(db, "sessions", "famille_dnd"), { combat_active: false, combat_monsters: [], current_turn_index: 0, combat_sound_trigger: 0 }, { merge: true });
      setMonsterQuantities({ gobelin: 0, loup: 0, klarg: 0 });
      for (const p of players) { await setDoc(doc(db, "sessions", "famille_dnd", "players", p.id), { initiative: null }, { merge: true }); }
    }
  };

  const handleNextTurn = async () => await setDoc(doc(db, "sessions", "famille_dnd"), { current_turn_index: (sessionData.current_turn_index || 0) + 1 }, { merge: true });

  const handleMonsterDamage = async (monsterId, damage) => {
    let allDead = true;
    const updatedMonsters = sessionData.combat_monsters.map(m => {
      let newHp = m.hp_current;
      if (m.id === monsterId) newHp = Math.max(0, m.hp_current + damage);
      if (newHp > 0) allDead = false;
      return { ...m, hp_current: newHp };
    });

    if (allDead && updatedMonsters.length > 0) {
      await setDoc(doc(db, "sessions", "famille_dnd"), { combat_active: false, combat_monsters: updatedMonsters, current_turn_index: 0, history_log: arrayUnion({ id: Date.now().toString(), text: `🏆 VICTOIRE ! Tous les ennemis ont été vaincus !`, color: '#10b981' }) }, { merge: true });
      setMonsterQuantities({ gobelin: 0, loup: 0, klarg: 0 });
      for (const p of players) { await setDoc(doc(db, "sessions", "famille_dnd", "players", p.id), { initiative: null }, { merge: true }); }
    } else {
      await setDoc(doc(db, "sessions", "famille_dnd"), { combat_monsters: updatedMonsters }, { merge: true });
    }
  };

  return (
    <div className="epic-dashboard" style={{ '--theme-color': '#d4af37' }}>
      <div className="dashboard-grid">
        <div className="left-panel">
          <div className="map-container epic-panel"><Map /></div>
          
          <div className="bottom-left-container" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="epic-panel" style={{ flex: 1, padding: '15px' }}>
                <h3 className="placeholder-title" style={{ color: 'var(--gold)', margin: '0 0 10px 0' }}>Cartes & Logs</h3>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  <button className="epic-button-small" onClick={() => handleSelectMap('/map1.jpg')}>🗺️ Route</button>
                  <button className="epic-button-small" onClick={() => handleSelectMap('/map2.jpg')}>🗺️ Repaire</button>
                  <button className="epic-button-small" onClick={handleClearHistory} style={{ background: '#ef4444', color: 'white', width: '100%', marginTop: '5px' }}>🗑️ Vider</button>
                </div>
              </div>
              <div className="epic-panel" style={{ flex: 1, padding: '15px', textAlign: 'center' }}>
                <h3 className="placeholder-title" style={{ color: 'var(--gold)', margin: '0 0 10px 0' }}>Dés Joueurs</h3>
                <button onClick={handleToggleDice} className="epic-button-small" style={{ background: diceLocked ? '#374151' : 'linear-gradient(to bottom, var(--gold), var(--gold-dark))', color: diceLocked ? '#fff' : '#000', width: '100%', padding: '12px' }}>
                  {diceLocked ? "🔒 Verrouillés" : "🔓 Libérés"}
                </button>
              </div>
            </div>

            <div className="epic-panel" style={{ padding: '15px' }}>
              <h3 className="placeholder-title" style={{ color: 'var(--gold)', margin: '0 0 10px 0' }}>🤫 Jets Secrets MD</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                {[4,6,8,10,12,20,100].map(d => (
                  <button key={d} onClick={() => handleSecretRoll(d)} className="epic-button-small" style={{padding: '5px', background: '#374151', color: 'white'}}>d{d}</button>
                ))}
              </div>
              <div style={{ marginTop: '10px', background: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: '4px', height: '60px', overflowY: 'auto', fontSize: '0.85rem', textAlign: 'left' }}>
                {secretLogs.map(log => (<div key={log.id} style={{color: '#9ca3af', marginBottom: '2px'}}>🤫 {log.text}</div>))}
              </div>
            </div>
          </div>
        </div>

        <div className="right-panel epic-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          {/* NOUVELLE FICHE AVENTURIER DÉTAILLÉE POUR LE MD */}
          <h3 className="section-title">Aventuriers</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
            {players.map(p => (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.3)', padding: '10px', borderLeft: `4px solid ${p.color}`, gap: '8px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span onClick={() => handleKickPlayer(p.id)} style={{cursor:'pointer', marginRight: '5px'}}>❌</span>
                    <strong style={{ color: p.color, fontSize: '1.1rem' }}>{p.playerName}</strong>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7, marginLeft: '5px' }}>({p.name})</span>
                    {p.initiative !== null && p.initiative !== undefined && <span style={{fontSize:'0.9rem', color:'var(--gold)', marginLeft: '10px'}}>⚡ Init: {p.initiative}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => handlePlayerHP(p.id, p.hp_current, -1)} className="epic-button-small" style={{padding: '2px 8px'}}>-</button>
                    <span style={{ color: p.hp_current > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '1.1rem' }}>{p.hp_current} / {p.hp_max} PV</span>
                    <button onClick={() => handlePlayerHP(p.id, p.hp_current, 1)} className="epic-button-small" style={{padding: '2px 8px'}}>+</button>
                  </div>
                </div>

                {/* Bloc Stats pour le Maître du Donjon */}
                {p.stats && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '4px' }}>
                    <span title="Classe d'Armure" style={{ color: '#3b82f6', fontWeight: 'bold' }}>🛡️ CA: {p.ac}</span>
                    <span title="Perception Passive (10 + Mod Sagesse)" style={{ color: '#8b5cf6', fontWeight: 'bold' }}>👁️ Perc. Passive: {10 + Math.floor((p.stats.SAG - 10) / 2)}</span>
                    <span style={{ borderLeft: '1px solid #555', paddingLeft: '10px' }}>FOR: {p.stats.FOR}</span>
                    <span>DEX: {p.stats.DEX}</span>
                    <span>CON: {p.stats.CON}</span>
                    <span>INT: {p.stats.INT}</span>
                    <span>SAG: {p.stats.SAG}</span>
                    <span>CHA: {p.stats.CHA}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <h3 className="section-title">Contrôle du Combat</h3>
          {sessionData.combat_active ? (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid #ef4444' }}>
              <h4 style={{ color: '#ef4444', margin: '0 0 10px 0', textAlign: 'center' }}>⚔️ EN COMBAT</h4>
              {sessionData.combat_monsters?.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1f2937', padding: '5px 10px', marginBottom: '5px', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {m.initiative === null ? (
                      <button onClick={() => handleMonsterInit(m.id, m.name, m.dex)} style={{ background: '#eab308', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontWeight: 'bold' }}>🎲 Init</button>
                    ) : (
                      <button onClick={() => handleMonsterRoll(m.name)} disabled={m.hp_current === 0} style={{ background: 'transparent', border: 'none', cursor: m.hp_current === 0 ? 'not-allowed' : 'pointer', fontSize: '1.1rem' }} title="Attaque">🎲</button>
                    )}
                    <span style={{ textDecoration: m.hp_current === 0 ? 'line-through' : 'none', color: m.hp_current === 0 ? '#6b7280' : '#fff' }}>{m.name} (CA {m.ac})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => handleMonsterDamage(m.id, -1)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px' }}>-1</button>
                    <span style={{ color: m.hp_current === 0 ? '#6b7280' : '#fff', fontWeight: 'bold' }}>{m.hp_current} PV</span>
                    <button onClick={() => handleMonsterDamage(m.id, 1)} disabled={m.hp_current === 0} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px' }}>+1</button>
                  </div>
                </div>
              ))}
              <button className="epic-button-large" onClick={handleNextTurn} style={{ marginTop: '10px', width: '100%', padding: '15px', background: 'var(--gold)', color: '#000', fontSize: '1.2rem' }}>⏭️ Tour Suivant</button>
              <button className="epic-button-large" onClick={handleStopCombat} style={{ marginTop: '10px', width: '100%', padding: '10px', background: '#ef4444', color: '#fff' }}>🛑 Arrêt forcé du combat</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(monsterTemplates).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', padding: '8px', border: '1px solid #374151' }}>
                  <span>{value.name}</span>
                  <div>
                    <button className="epic-button-small" style={{padding: '2px 8px'}} onClick={() => updateQuantity(key, -1)}>-</button>
                    <span style={{ margin: '0 10px', fontWeight: 'bold' }}>{monsterQuantities[key]}</span>
                    <button className="epic-button-small" style={{padding: '2px 8px'}} onClick={() => updateQuantity(key, 1)}>+</button>
                  </div>
                </div>
              ))}
              <button className="epic-button-large" onClick={handleStartCombat} style={{ marginTop: '10px', width: '100%', padding: '10px' }}>⚔️ Lancer le Combat !</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}