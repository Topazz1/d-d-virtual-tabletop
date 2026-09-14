# ⚔️ D&D Tabletop // Real-Time Virtual Tabletop (VTT)

> A synchronized, lightweight Virtual Tabletop application designed to run remote Dungeons & Dragons campaigns, featuring role-based dashboards, automated combat initiative tracking, and real-time multiplayer dice animations.

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](#)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white)](#)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](#)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-11.x-black?style=flat-square&logo=framer&logoColor=white)](#)

---

## 📌 Overview

Built to streamline remote family tabletop sessions, **D&D Tabletop** eliminates the clutter of generic VTT platforms by offering a custom-tailored, zero-latency interface. The architecture separates the user experience into two specialized interfaces backed by real-time reactive streams:

1. **The Dungeon Master (DM) Command Console:** Full oversight of combat encounters, live party statistics, secret rolls, interactive maps, and dice permissions.
2. **The Player Hub:** An interactive, dark-fantasy character sheet featuring automated stat modifiers, live health trackers, inventory/spells, and an interactive dice bag.

```text
                        ┌──────────────────────────────┐
                        │   Firebase Cloud Firestore   │
                        │   (Live Session Documents)   │
                        └──────────────┬───────────────┘
                                       │ 
                 WebSocket Listeners (onSnapshot Sync)
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────┐                             ┌───────────────────────┐
│ Dungeon Master (DM)   │                             │   Player Dashboard    │
│  - Combat Engine      │ ─── [Broadcast Roll] ─────► │  - Interactive Sheet  │
│  - Monster Spawner    │                             │  - Dice Bag (Lockable)│
│  - Player Oversight   │ ◄── [Initiative / Action] ─ │  - Synchronized Map   │
└───────────────────────┘                             └───────────────────────┘
            │                                                     │
            └──────────────────────────┬──────────────────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │  Global DiceOverlay (HUD)     │
                       │  - Screen-wide 2D roll stream │
                       │  - Dynamic particle lighting  │
                       └───────────────────────────────┘

```

---

## ⚡ Key Features

### 1. Global Synchronized Dice Engine

* **Real-Time Visual Broadcasting:** Rolling any die (d4 through d100) triggers an immediate full-screen broadcast overlay on all connected client screens with sub-second synchronization via Firebase Firestore listeners.


* **Kinetic Animations:** Physics-based rolling ticker that settles into a highlighted critical result accompanied by custom theme colors per player or monster.


* **Decoupled History Ingestion:** Roll events trigger animations first before committing validated historical entries into the session log, preventing UI race conditions.



### 2. Comprehensive Dungeon Master Suite

* **Automated Combat & Initiative Engine:** Generate monster squads (Goblins, Wolves, Bugbears) with pre-configured Armor Class (AC) and hit points (HP). One-click automated initiative rolling with Dexterity modifiers, combat turn progression, and dynamic win/loss detection.


* **Live Party Telemetry:** Real-time monitoring of all party members: current/max HP adjustments, Armor Class, passive perception, and core D&D attributes (STR, DEX, CON, INT, WIS, CHA).


* **Session Controls:** Toggle global dice locking to prevent out-of-turn rolls, swap active tactical maps, trigger narrative ambush alerts, and execute secret DM rolls invisible to players.



### 3. Immersive Player Interface

* **Dynamic Character Sheet:** Interactive display with responsive health trackers, ability scores, skill checks, weapon attacks with automated hit/damage bonuses, and class features.


* **Hero Onboarding:** Guided character selection screen featuring interactive card transitions, stats inspection, and character association.


* **Contextual Prompts:** Automatic full-screen action banners when encounters trigger (e.g., *Roll for Initiative*).



---

## 🛠️ Tech Stack

* **Frontend Core:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)

* **State Management & Real-Time Sync:** [Firebase Cloud Firestore](https://firebase.google.com/docs/firestore) (`onSnapshot` real-time listeners, atomic batch transactions)

* **Motion & UI Dynamics:** [Framer Motion](https://www.framer.com/motion/)

* **Styling Architecture:** Custom CSS3 with CSS variables, radial gradients, custom scrollbars, and dark fantasy typography (*Cinzel* & *Lora*)



---

## 🗄️ Database & State Architecture

The application relies on a streamlined document structure within Firestore:

```text
sessions/
└── dnd/
    ├── combat_active: boolean
    ├── combat_monsters: Array<{ id, name, hp_max, hp_current, ac, initiative }>
    ├── current_map: string (URI)
    ├── dice_locked: boolean
    ├── active_roll: { id, roller, color, type, result }
    ├── history_log: Array<{ id, text, color }>
    └── players/
        └── [playerName]/
            ├── characterId: string
            ├── hp_current: number
            ├── hp_max: number
            ├── initiative: number | null
            └── stats: { FOR, DEX, CON, INT, SAG, CHA }

```

---

## 🚀 Quick Start

### Prerequisites

* **Node.js** `>= 18.0.0`
* A configured **Firebase** project with Cloud Firestore enabled

### Installation

1. Clone the repository:
```bash
git clone [https://github.com/Topazz1/d-d-virtual-tabletop](https://github.com/Topazz1/d-d-virtual-tabletop)
cd d-d-virtual-tabletop

```


2. Install dependencies:
```bash
npm install

```


3. Configure Firebase credentials:
Create a `src/firebase.js` configuration file:
```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

```


4. Launch the local development server:
```bash
npm run dev

```



### Default Access Credentials

* **Dungeon Master Login:** Enter `MD_Tom` as the adventurer name to route directly to the Master Dashboard.

* **Player Login:** Enter any unique adventurer name to access character selection.



---

## 👤 Author

**Tom Padovani**

Computer Science & Socio-Technical Systems (Hutech) Engineering Student — **UTC Compiègne**

* LinkedIn: [@tom-padovani](https://www.linkedin.com/in/tom-padovani-2b0b87382/)
* GitHub: [@tomPadovani](https://github.com/Topazz1)
