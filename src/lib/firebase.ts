import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  console.log("Attempting Google Login...");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Login success:", result.user.email);
    return result;
  } catch (error) {
    console.error("Login error in firebase.ts:", error);
    throw error;
  }
};
export const logout = async () => {
  console.log("Logging out...");
  try {
    await auth.signOut();
    console.log("Logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
