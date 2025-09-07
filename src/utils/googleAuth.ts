import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase.js';

export interface GoogleUser {
  id: string;
  email: string | null;
  name: string | null;
  provider: string;
}

export async function signInWithGoogle(): Promise<GoogleUser> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    return {
      id: user.uid,
      email: user.email,
      name: user.displayName,
      provider: 'google',
    };
  } catch (error: any) {
    console.error('Google sign-in error code:', error.code);
    console.error('Google sign-in error message:', error.message);
    throw error;
  }
}
