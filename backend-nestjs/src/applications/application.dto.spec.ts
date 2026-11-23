import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ApplicationDto } from './application.dto.js';

async function errorsFor(payload: Record<string, unknown>) {
  const errors = await validate(plainToInstance(ApplicationDto, payload));
  return errors.map((e) => e.property);
}

describe('ApplicationDto', () => {
  const valid = { company: 'Acme', position: 'Développeur' };

  it('accepte le minimum requis', async () => {
    expect(await errorsFor(valid)).toEqual([]);
  });

  it('accepte une candidature complète', async () => {
    expect(
      await errorsFor({
        ...valid,
        offerUrl: 'https://example.com/offre',
        status: 'INTERVIEW',
        appliedAt: '2026-03-01',
        notes: 'Relancer lundi',
      }),
    ).toEqual([]);
  });

  it('exige company et position', async () => {
    expect(await errorsFor({})).toEqual(['company', 'position']);
  });

  it.each([
    ['company', 'A'],
    ['company', 'x'.repeat(101)],
    ['position', 'B'],
    ['position', 'y'.repeat(101)],
  ])('refuse %s hors de 2 à 100 caractères', async (field, value) => {
    expect(await errorsFor({ ...valid, [field]: value })).toEqual([field]);
  });

  it('refuse une URL invalide', async () => {
    expect(await errorsFor({ ...valid, offerUrl: 'pas une url' })).toEqual([
      'offerUrl',
    ]);
  });

  it('refuse un statut inconnu', async () => {
    expect(await errorsFor({ ...valid, status: 'GHOSTED' })).toEqual([
      'status',
    ]);
  });

  it('refuse une date invalide', async () => {
    expect(await errorsFor({ ...valid, appliedAt: 'hier' })).toEqual([
      'appliedAt',
    ]);
  });

  it('refuse des notes de plus de 2000 caractères', async () => {
    expect(await errorsFor({ ...valid, notes: 'n'.repeat(2001) })).toEqual([
      'notes',
    ]);
  });

  it('accepte null pour les champs optionnels', async () => {
    expect(
      await errorsFor({
        ...valid,
        offerUrl: null,
        appliedAt: null,
        notes: null,
      }),
    ).toEqual([]);
  });
});
