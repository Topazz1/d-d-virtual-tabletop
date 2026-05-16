// src/initCharacters.js
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const characters = [
  {
    id: "guerrier-noble",
    name: "Guerrier (Noble)",
    race: "Humain",
    alignment: "Loyal Neutre",
    ac: 16, hp_max: 12, speed: "9m",
    color: "#b91c1c", // Rouge
    image: "/assets/human.jpg", // <--- L'image !
    description: "Un noble en armure lourde armé d'une hache à deux mains. Vous savez flatter les gens mais refusez de vous salir.",
    stats: { FOR: 16, DEX: 9, CON: 15, INT: 11, SAG: 13, CHA: 14 },
    saves: { FOR: "+5", CON: "+4" },
    skills: { Athlétisme: "+5", Histoire: "+2", Persuasion: "+4" },
    attacks: [ { name: "Hache à deux mains", bonus: "+5", damage: "1d12+3 tranchants" }, { name: "Javeline", bonus: "+5", damage: "1d6+3 perforants" } ],
    features: ["Second souffle", "Style de combat (défense)", "Privilégié"]
  },
  {
    id: "clerc-soldat",
    name: "Clerc (Soldat)",
    race: "Nain des collines",
    alignment: "Neutre Bon",
    ac: 18, hp_max: 11, speed: "7.5m",
    color: "#d97706", // Doré
    image: "/assets/dwarf.png", // <--- L'image !
    description: "Un vétéran mercenaire de Mintarn, fidèle à Marthammor Duin. Armé d'un marteau de guerre.",
    stats: { FOR: 14, DEX: 8, CON: 15, INT: 10, SAG: 16, CHA: 12 },
    saves: { SAG: "+5", CHA: "+3" },
    skills: { Athlétisme: "+4", Intimidation: "+3", Médecine: "+5", Religion: "+2" },
    attacks: [ { name: "Marteau de guerre", bonus: "+4", damage: "1d8+2 contondants" }, { name: "Hachette", bonus: "+4", damage: "1d6+2 tranchants" } ],
    features: ["Disciple de la vie", "Vision dans le noir", "Résistance naine"]
  },
  {
    id: "roublard-criminel",
    name: "Roublard (Criminel)",
    race: "Halfelin pied-léger",
    alignment: "Neutre",
    ac: 14, hp_max: 9, speed: "7.5m",
    color: "#059669", // Emeraude
    image: "/assets/halfelin.jpg", // <--- L'image !
    description: "Un ancien membre du gang des Fers Rouges cherchant vengeance, redoutable avec son arc court.",
    stats: { FOR: 8, DEX: 16, CON: 12, INT: 13, SAG: 10, CHA: 16 },
    saves: { DEX: "+5", INT: "+3" },
    skills: { Acrobaties: "+5", Discrétion: "+7", Escamotage: "+5", Investigation: "+3", Représentation: "+5", Tromperie: "+5" },
    attacks: [ { name: "Épée courte", bonus: "+5", damage: "1d6+3 perforants" }, { name: "Arc court", bonus: "+5", damage: "1d6+3 perforants" } ],
    features: ["Attaque sournoise", "Argot des voleurs", "Chanceux"]
  },
  {
    id: "magicien-acolyte",
    name: "Magicien (Acolyte)",
    race: "Haut-elfe",
    alignment: "Chaotique Bon",
    ac: 12, hp_max: 8, speed: "9m",
    color: "#2563eb", // Bleu
    image: "/assets/elf.jpg", // <--- L'image !
    description: "Un érudit dédié à Oghma, transportant son précieux grimoire pour percer les mystères du multivers.",
    stats: { FOR: 10, DEX: 15, CON: 14, INT: 16, SAG: 12, CHA: 8 },
    saves: { INT: "+5", SAG: "+3" },
    skills: { Arcanes: "+5", Investigation: "+5", Intuition: "+3", Médecine: "+1", Religion: "+5" },
    attacks: [ { name: "Épée courte", bonus: "+4", damage: "1d6+2 perforants" } ],
    features: ["Restauration magique", "Vision dans le noir", "Transe"]
  },
  {
    id: "guerrier-heros",
    name: "Guerrier (Héros du Peuple)",
    race: "Humain",
    alignment: "Loyal Bon",
    ac: 14, hp_max: 12, speed: "9m",
    color: "#4f46e5", // Indigo
    image: "/assets/human2.jpg", // <--- L'image !
    description: "Un tireur d'élite à l'arc long originaire d'Arbrefoudre, destiné à devenir un héros.",
    stats: { FOR: 14, DEX: 16, CON: 15, INT: 11, SAG: 13, CHA: 9 },
    saves: { FOR: "+4", CON: "+4" },
    skills: { Dressage: "+3", Perception: "+3", Survie: "+3" },
    attacks: [ { name: "Épée à deux mains", bonus: "+4", damage: "2d6+2 tranchants" }, { name: "Arc long", bonus: "+7", damage: "1d8+3 perforants" } ],
    features: ["Second souffle", "Style de combat (archerie)", "Hospitalité rustique"]
  }
];

export const initDB = async () => {
  try {
    for (const char of characters) {
      await setDoc(doc(db, "characters_templates", char.id), char);
    }
    alert("Les 5 personnages (avec images) ont été injectés !");
  } catch (error) {
    console.error("Erreur d'injection : ", error);
  }
};