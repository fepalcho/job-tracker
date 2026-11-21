import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAcb53Bcoajfii8tl9xdIkyNXz6DpUClIQ',
  authDomain: 'taxi-demo-497a3.firebaseapp.com',
  projectId: 'taxi-demo-497a3',
  storageBucket: 'taxi-demo-497a3.firebasestorage.app',
  messagingSenderId: '99390352547',
  appId: '1:99390352547:web:090944b49a64dd03812316',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);