export default function CharacterSheet({ player }) {
  return (
    <div className="character-sheet">
      {/* En-tête : Portrait et Titre */}
      <div className="cs-header">
        <img src={player.image} alt={player.name} className="cs-portrait" />
        <div className="cs-title-box">
          <h2 className="cs-name">{player.name}</h2>
          <p className="cs-subtitle">{player.race} • {player.alignment}</p>
        </div>
      </div>

      {/* Barre de vie et Défense */}
      <div className="cs-vital-stats">
        <div className="vital-box hp-box">
          <span className="vital-label">Points de Vie</span>
          <span className="vital-value">{player.hp_current} / {player.hp_max}</span>
        </div>
        <div className="vital-box ac-box">
          <span className="vital-label">Classe d'Armure</span>
          <span className="vital-value">🛡️ {player.ac}</span>
        </div>
        <div className="vital-box speed-box">
          <span className="vital-label">Vitesse</span>
          <span className="vital-value">👟 {player.speed}</span>
        </div>
      </div>

      <div className="cs-scrollable-content">
        {/* Caractéristiques (Force, Dex, etc.) */}
        <h3 className="section-title">Caractéristiques</h3>
        <div className="stats-grid">
          {player.stats && Object.entries(player.stats).map(([statName, value]) => (
            <div key={statName} className="stat-block">
              <span className="stat-name">{statName}</span>
              <span className="stat-value">{value}</span>
            </div>
          ))}
        </div>

        {/* Attaques */}
        <h3 className="section-title">Arsenal & Attaques</h3>
        <div className="attacks-list">
          {player.attacks && player.attacks.map((atk, i) => (
            <div key={i} className="attack-row">
              <span className="atk-name">⚔️ {atk.name}</span>
              <span className="atk-bonus">{atk.bonus} au toucher</span>
              <span className="atk-damage">{atk.damage}</span>
            </div>
          ))}
        </div>

        {/* Compétences et Sauvegardes */}
        <div className="skills-saves-container">
          <div className="ss-column">
            <h3 className="section-title">Sauvegardes</h3>
            <ul className="ss-list">
              {player.saves && Object.entries(player.saves).map(([save, bonus]) => (
                <li key={save}><span className="ss-bonus">{bonus}</span> {save}</li>
              ))}
            </ul>
          </div>
          <div className="ss-column">
            <h3 className="section-title">Compétences</h3>
            <ul className="ss-list">
              {player.skills && Object.entries(player.skills).map(([skill, bonus]) => (
                <li key={skill}><span className="ss-bonus">{bonus}</span> {skill}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Aptitudes */}
        <h3 className="section-title">Aptitudes de Classe</h3>
        <div className="features-list">
          {player.features && player.features.map((feat, i) => (
            <span key={i} className="feature-pill">{feat}</span>
          ))}
        </div>
      </div>
    </div>
  );
}