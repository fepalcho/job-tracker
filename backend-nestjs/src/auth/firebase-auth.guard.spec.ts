import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';

const { getApps, initializeApp, verifyIdToken } = vi.hoisted(() => ({
  getApps: vi.fn(),
  initializeApp: vi.fn(),
  verifyIdToken: vi.fn(),
}));

vi.mock('firebase-admin/app', () => ({ getApps, initializeApp }));
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken }),
}));

import { FirebaseAuthGuard } from './firebase-auth.guard.js';

function contextFor(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
}

describe('FirebaseAuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getApps.mockReturnValue([{}]);
  });

  it("initialise Firebase s'il ne l'est pas encore", () => {
    getApps.mockReturnValue([]);
    process.env.FIREBASE_PROJECT_ID = 'projet-test';
    new FirebaseAuthGuard();
    expect(initializeApp).toHaveBeenCalledWith({ projectId: 'projet-test' });
  });

  it('ne réinitialise pas Firebase si une app existe déjà', () => {
    new FirebaseAuthGuard();
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it('refuse une requête sans en-tête Authorization', async () => {
    const guard = new FirebaseAuthGuard();
    await expect(
      guard.canActivate(contextFor({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it("refuse un en-tête qui n'est pas de type Bearer", async () => {
    const guard = new FirebaseAuthGuard();
    await expect(
      guard.canActivate(
        contextFor({ headers: { authorization: 'Basic abc' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refuse un token rejeté par Firebase', async () => {
    verifyIdToken.mockRejectedValue(new Error('expired'));
    const guard = new FirebaseAuthGuard();
    await expect(
      guard.canActivate(
        contextFor({ headers: { authorization: 'Bearer mauvais' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("accepte un token valide et attache l'utilisateur à la requête", async () => {
    verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'a@b.c', extra: 1 });
    const request: Record<string, unknown> = {
      headers: { authorization: 'Bearer bon-token' },
    };
    const guard = new FirebaseAuthGuard();

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(verifyIdToken).toHaveBeenCalledWith('bon-token');
    expect(request.user).toEqual({ uid: 'u1', email: 'a@b.c' });
  });
});
