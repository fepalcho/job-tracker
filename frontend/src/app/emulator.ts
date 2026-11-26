import type { Auth } from 'firebase/auth';

/**
 * Hors e2e : aucun émulateur. Ce fichier est remplacé par emulator.e2e.ts
 * dans la configuration Angular "e2e" (fileReplacements), si bien que le
 * build de production ne contient aucun code d'émulateur.
 */
export const setupEmulator: (auth: Auth) => void = () => undefined;
