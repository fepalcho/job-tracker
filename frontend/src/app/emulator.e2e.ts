import {
  type Auth,
  browserSessionPersistence,
  connectAuthEmulator,
  GoogleAuthProvider,
  setPersistence,
  signInWithCredential,
} from 'firebase/auth';

export interface E2eUser {
  sub: string;
  email: string;
  name: string;
}

declare global {
  interface Window {
    /** Connecte un faux compte Google via l'émulateur, sans popup. Renvoie l'ID token. */
    e2eSignIn?: (user: E2eUser) => Promise<string>;
  }
}

export function setupEmulator(auth: Auth): void {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  // Session en sessionStorage : Cypress le vide entre deux tests, ce qui évite
  // qu'un utilisateur reste connecté d'un scénario à l'autre (IndexedDB par défaut).
  const persistence = setPersistence(auth, browserSessionPersistence);

  window.e2eSignIn = async (user) => {
    await persistence;
    // L'émulateur accepte un id_token Google non signé, au format JSON.
    const credential = GoogleAuthProvider.credential(JSON.stringify(user));
    const result = await signInWithCredential(auth, credential);
    return result.user.getIdToken();
  };
}
