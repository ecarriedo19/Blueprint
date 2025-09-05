// Utility for Google OAuth in React
// Install: npm install firebase
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBt96DQi_re3l79vVpIsAj6Ay7CKNdjpho",
  authDomain: "blueprint-1543f.firebaseapp.com",
  projectId: "blueprint-1543f",
  storageBucket: "blueprint-1543f.firebasestorage.app",
  messagingSenderId: "36165091039",
  appId: "1:36165091039:web:c80f30a6a202ab1271336a",
  measurementId: "G-SB46VLGELN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  return {
    id: user.uid,
    email: user.email,
    name: user.displayName,
    provider: 'google',
  };
}
