import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBt96DQi_re3l79vVpIsAj6Ay7CKNdjpho",
  authDomain: "blueprint-1543f.firebaseapp.com",
  projectId: "blueprint-1543f",
  storageBucket: "blueprint-1543f.appspot.com",
  messagingSenderId: "36165091039",
  appId: "1:36165091039:web:c80f30a6a202ab1271336a",
  measurementId: "G-SB46VLGELN"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
