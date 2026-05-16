import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login({ onLogin }) {
  const [step, setStep] = useState(0); // 0 = Nom, 1 = Sélection Héros
  const [templates, setTemplates] = useState([]);
  const [playerName, setPlayerName] = useState("");
  const [selectedChar, setSelectedChar] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      const querySnapshot = await getDocs(collection(db, "characters_templates"));
      const chars = [];
      querySnapshot.forEach((doc) => chars.push({ id: doc.id, ...doc.data() }));
      setTemplates(chars);
    };
    fetchTemplates();
  }, []);


  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (playerName.trim() === "MD_Tom") {
      // Connexion directe en tant que MD sans passer par la sélection
      onLogin({ playerName: "MD_Tom", isMD: true });
    } else if (playerName.trim() !== "") {
      setStep(1); // On passe à la sélection de personnage pour les joueurs normaux
    }
  };

  const handleJoin = async () => {
    if (!selectedChar) return;
    const playerRef = doc(db, "sessions", "famille_dnd", "players", playerName);
    const playerData = {
      playerName,
      characterId: selectedChar.id,
      ...selectedChar,
      hp_current: selectedChar.hp_max
    };
    await setDoc(playerRef, playerData);
    onLogin(playerData);
  };

  return (
    <div className="epic-login-bg">
      <AnimatePresence mode="wait">
        
        {step === 0 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="name-prompt"
          >
            <h1 className="epic-title">Entrez dans la Légende</h1>
            <form onSubmit={handleNameSubmit}>
              <input 
                className="epic-input"
                type="text" 
                placeholder="Quel est votre nom, aventurier ?" 
                value={playerName} 
                onChange={(e) => setPlayerName(e.target.value)} 
                autoFocus
              />
              <button type="submit" className="epic-button">Suivant</button>
            </form>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hero-selection-screen"
          >
            <h2 className="epic-subtitle">Bienvenue dans l'aventure, {playerName}</h2>
            <p className="epic-instruction">Choisissez votre destinée</p>
            
            <div className="epic-cards-container">
              {templates.map((char, index) => (
                <motion.div 
                  key={char.id}
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -10, boxShadow: `0px 0px 20px ${char.color}` }}
                  className={`epic-card ${selectedChar?.id === char.id ? 'selected' : ''}`}
                  onClick={() => setSelectedChar(char)}
                  style={{ '--char-color': char.color }}
                >
                  <div className="card-image-wrapper">
                    <img src={char.image} alt={char.name} className="card-image" />
                    <div className="card-gradient"></div>
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">{char.name}</h3>
                    <p className="card-subtitle">{char.race} • {char.alignment}</p>
                    <p className="card-desc">{char.description}</p>
                    <div className="card-stats">
                      <span>🛡️ {char.ac}</span>
                      <span>❤️ {char.hp_max}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button 
              initial={{ opacity: 0 }}
              animate={{ opacity: selectedChar ? 1 : 0 }}
              disabled={!selectedChar}
              onClick={handleJoin} 
              className="epic-button-large"
            >
              Forger le Pacte
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}