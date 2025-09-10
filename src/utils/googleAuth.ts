import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth } from './firebase.js';

export interface GoogleUser {
  id: string;
  email: string | null;
  name: string | null;
  profilePictureUrl?: string | null;
  provider: string;
}

export async function signInWithGoogle(): Promise<GoogleUser> {
  const provider = new GoogleAuthProvider();
  // Add scopes for profile information
  provider.addScope('profile');
  provider.addScope('email');
  
  try {
    console.log('Attempting Google sign-in with popup...');
    // Try popup first, fallback to redirect
    let result;
    try {
      result = await signInWithPopup(auth, provider);
      console.log('Popup sign-in successful');
    } catch (popupError: any) {
      console.log('Popup failed:', popupError.code, popupError.message);
      console.log('Popup blocked, trying redirect method...');
      // If popup is blocked, use redirect
      await signInWithRedirect(auth, provider);
      return Promise.reject(new Error('REDIRECT_INITIATED'));
    }
    
    const user = result.user;
    console.log('Firebase user object:', user);
    return {
      id: user.uid,
      email: user.email,
      name: user.displayName,
      profilePictureUrl: user.photoURL,
      provider: 'google',
    };
  } catch (error: any) {
    console.error('Google sign-in error code:', error.code);
    console.error('Google sign-in error message:', error.message);
    console.error('Full error object:', error);
    throw error;
  }
}

export async function checkRedirectResult(): Promise<GoogleUser | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const user = result.user;
      return {
        id: user.uid,
        email: user.email,
        name: user.displayName,
        profilePictureUrl: user.photoURL,
        provider: 'google',
      };
    }
    return null;
  } catch (error: any) {
    console.error('Redirect result error:', error);
    throw error;
  }
}
