import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApplicationsService } from './applications.service.js';
import type { ApplicationDto } from './application.dto.js';

const UID = 'user-1';
const ID = '507f1f77bcf86cd799439011';

function createModelMock() {
  const lean = vi.fn();
  const sort = vi.fn(() => ({ lean }));
  return {
    lean,
    sort,
    find: vi.fn(() => ({ sort })),
    findOne: vi.fn(() => ({ lean })),
    findOneAndUpdate: vi.fn(() => ({ lean })),
    create: vi.fn(),
    deleteOne: vi.fn(),
  };
}

describe('ApplicationsService', () => {
  let model: ReturnType<typeof createModelMock>;
  let service: ApplicationsService;

  beforeEach(() => {
    model = createModelMock();
    service = new ApplicationsService(model as never);
  });

  describe('findAll', () => {
    it('filtre par propriétaire et trie par date de mise à jour décroissante', async () => {
      const docs = [{ company: 'Acme' }];
      model.lean.mockResolvedValue(docs);

      await expect(service.findAll(UID)).resolves.toBe(docs);
      expect(model.find).toHaveBeenCalledWith({ ownerUid: UID });
      expect(model.sort).toHaveBeenCalledWith({ updatedAt: -1 });
    });
  });

  describe('findOne', () => {
    it('renvoie la candidature du propriétaire', async () => {
      const doc = { _id: ID, company: 'Acme' };
      model.lean.mockResolvedValue(doc);

      await expect(service.findOne(UID, ID)).resolves.toBe(doc);
      expect(model.findOne).toHaveBeenCalledWith({ _id: ID, ownerUid: UID });
    });

    it("lève NotFound si la candidature n'existe pas ou appartient à un autre", async () => {
      model.lean.mockResolvedValue(null);
      await expect(service.findOne(UID, ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lève NotFound sans interroger la base si l’id est invalide', async () => {
      await expect(service.findOne(UID, 'pas-un-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(model.findOne).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('crée la candidature en lui attribuant le propriétaire', async () => {
      const dto: ApplicationDto = { company: 'Acme', position: 'Dev' };
      const created = { ...dto, ownerUid: UID };
      model.create.mockResolvedValue(created);

      await expect(service.create(UID, dto)).resolves.toBe(created);
      expect(model.create).toHaveBeenCalledWith({ ...dto, ownerUid: UID });
    });

    it('ignore un ownerUid fourni dans le corps de la requête', async () => {
      const dto = { company: 'Acme', position: 'Dev', ownerUid: 'pirate' };
      await service.create(UID, dto as ApplicationDto);
      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({ ownerUid: UID }),
      );
    });

    it("accepte le statut TO_APPLY sans date d'envoi", async () => {
      const dto: ApplicationDto = {
        company: 'Acme',
        position: 'Dev',
        status: 'TO_APPLY',
      };
      await service.create(UID, dto);
      expect(model.create).toHaveBeenCalled();
    });

    it.each(['SENT', 'INTERVIEW', 'OFFER', 'REJECTED'] as const)(
      "refuse le statut %s sans date d'envoi",
      (status) => {
        const dto: ApplicationDto = {
          company: 'Acme',
          position: 'Dev',
          status,
        };
        expect(() => service.create(UID, dto)).toThrow(BadRequestException);
        expect(model.create).not.toHaveBeenCalled();
      },
    );

    it("accepte un statut avancé avec une date d'envoi", async () => {
      const dto: ApplicationDto = {
        company: 'Acme',
        position: 'Dev',
        status: 'SENT',
        appliedAt: '2026-01-15',
      };
      await service.create(UID, dto);
      expect(model.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const dto: ApplicationDto = { company: 'Acme', position: 'Lead dev' };

    it('met à jour la candidature du propriétaire avec les validateurs', async () => {
      const updated = { _id: ID, ...dto };
      model.lean.mockResolvedValue(updated);

      await expect(service.update(UID, ID, dto)).resolves.toBe(updated);
      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: ID, ownerUid: UID },
        dto,
        { returnDocument: 'after', runValidators: true },
      );
    });

    it("lève NotFound si la candidature n'existe pas", async () => {
      model.lean.mockResolvedValue(null);
      await expect(service.update(UID, ID, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lève NotFound si l’id est invalide', async () => {
      await expect(service.update(UID, 'xyz', dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(model.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("refuse un statut avancé sans date d'envoi", async () => {
      await expect(
        service.update(UID, ID, { ...dto, status: 'INTERVIEW' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(model.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('supprime la candidature du propriétaire', async () => {
      model.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await expect(service.remove(UID, ID)).resolves.toBeUndefined();
      expect(model.deleteOne).toHaveBeenCalledWith({ _id: ID, ownerUid: UID });
    });

    it("lève NotFound si rien n'a été supprimé", async () => {
      model.deleteOne.mockResolvedValue({ deletedCount: 0 });
      await expect(service.remove(UID, ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lève NotFound si l’id est invalide', async () => {
      await expect(service.remove(UID, '123')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(model.deleteOne).not.toHaveBeenCalled();
    });
  });
});
