import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard.js';
import type { AuthUser } from '../auth/current-user.decorator.js';
import { ApplicationsController } from './applications.controller.js';
import type { ApplicationsService } from './applications.service.js';
import type { ApplicationDto } from './application.dto.js';

describe('ApplicationsController', () => {
  const user: AuthUser = { uid: 'user-1', email: 'a@b.c' };
  const id = '507f1f77bcf86cd799439011';
  const dto: ApplicationDto = { company: 'Acme', position: 'Dev' };
  let service: Record<keyof ApplicationsService, ReturnType<typeof vi.fn>>;
  let controller: ApplicationsController;

  beforeEach(() => {
    service = {
      findAll: vi.fn().mockResolvedValue(['all']),
      findOne: vi.fn().mockResolvedValue('one'),
      create: vi.fn().mockResolvedValue('created'),
      update: vi.fn().mockResolvedValue('updated'),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    controller = new ApplicationsController(
      service as unknown as ApplicationsService,
    );
  });

  it('est protégé par FirebaseAuthGuard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, ApplicationsController);
    expect(guards).toContain(FirebaseAuthGuard);
  });

  it("findAll délègue avec l'uid de l'utilisateur", async () => {
    await expect(controller.findAll(user)).resolves.toEqual(['all']);
    expect(service.findAll).toHaveBeenCalledWith('user-1');
  });

  it("findOne délègue avec l'uid et l'id", async () => {
    await expect(controller.findOne(user, id)).resolves.toBe('one');
    expect(service.findOne).toHaveBeenCalledWith('user-1', id);
  });

  it("create délègue avec l'uid et le DTO", async () => {
    await expect(controller.create(user, dto)).resolves.toBe('created');
    expect(service.create).toHaveBeenCalledWith('user-1', dto);
  });

  it("update délègue avec l'uid, l'id et le DTO", async () => {
    await expect(controller.update(user, id, dto)).resolves.toBe('updated');
    expect(service.update).toHaveBeenCalledWith('user-1', id, dto);
  });

  it("remove délègue avec l'uid et l'id", async () => {
    await expect(controller.remove(user, id)).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith('user-1', id);
  });
});
