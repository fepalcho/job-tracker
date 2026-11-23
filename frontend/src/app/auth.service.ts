import { Injectable, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from './firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(null);

  constructor() {
    onAuthStateChanged(auth, (user) => this.user.set(user));
  }

  async ready(): Promise<User | null> {
    await auth.authStateReady();
    return auth.currentUser;
  }

  login() {
    return signInWithPopup(auth, new GoogleAuthProvider());
  }

  logout() {
    return signOut(auth);
  }
}
