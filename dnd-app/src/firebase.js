import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOeYknVjHwogAQy09lYYSpTLGlH23L2Gw",
  authDomain: "detd-virtual-tabletop.firebaseapp.com",
  projectId: "detd-virtual-tabletop",
  storageBucket: "detd-virtual-tabletop.firebasestorage.app",
  messagingSenderId: "594184334658",
  appId: "1:594184334658:web:0269ccd93bc6ec0093ecdb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialisation de Firestore et exportation pour l'utiliser dans tes composants
export const db = getFirestore(app);