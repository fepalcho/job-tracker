import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Application } from './applications.api';
import { ApplicationsPage } from './applications-page';
import { AuthService } from './auth.service';

const CAPGEMINI: Application = {
  _id: '1',
  company: 'Capgemini',
  position: 'Développeur fullstack',
  status: 'SENT',
  appliedAt: '2026-11-20T12:00:00.000Z',
  offerUrl: null,
  notes: null,
};

describe('ApplicationsPage', () => {
  const auth = { user: signal({ displayName: 'Alice' }), logout: vi.fn() };
  let http: HttpTestingController;

  beforeEach(async () => {
    auth.logout.mockReset().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [ApplicationsPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function render(items: Application[] = []) {
    const fixture = TestBed.createComponent(ApplicationsPage);
    fixture.detectChanges();
    http.expectOne({ method: 'GET', url: '/api/applications' }).flush(items);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const rows = (el: HTMLElement) => Array.from(el.querySelectorAll('tbody tr'));
  const cells = (row: Element) =>
    Array.from(row.querySelectorAll('td')).map((td) => td.textContent);
  const button = (el: Element, label: string) =>
    Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.includes(label) || b.getAttribute('aria-label')?.includes(label),
    )!;
  const input = (el: HTMLElement, name: string) =>
    el.querySelector<HTMLInputElement>(`[formcontrolname="${name}"]`)!;
  function type(el: HTMLElement, name: string, value: string) {
    const field = input(el, name);
    field.value = value;
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('change'));
  }

  it("affiche l'utilisateur connecté et un message si la liste est vide", async () => {
    const { el } = await render();
    expect(el.querySelector('h1')?.textContent).toContain('Mes candidatures');
    expect(el.textContent).toContain('Alice');
    expect(rows(el).map(cells)).toEqual([["Aucune candidature pour l'instant."]]);
  });

  it('affiche chaque candidature avec son statut en clair et sa date', async () => {
    const { el } = await render([CAPGEMINI]);
    const [row] = rows(el);
    expect(cells(row).slice(0, 4)).toEqual([
      'Capgemini',
      'Développeur fullstack',
      'Envoyée',
      '20/11/2026',
    ]);
  });

  it('propose tous les statuts, « À contacter » par défaut', async () => {
    const { el } = await render();
    const select = el.querySelector<HTMLSelectElement>('select[formcontrolname="status"]')!;
    expect(Array.from(select.options).map((o) => o.textContent?.trim())).toEqual([
      'À contacter',
      'Envoyée',
      'Entretien',
      'Offre',
      'Refus',
    ]);
    expect(select.value).toBe('TO_APPLY');
  });

  it("refuse le formulaire sans entreprise et n'appelle pas l'API", async () => {
    const { fixture, el } = await render();
    type(el, 'position', 'Développeur fullstack');
    el.querySelector<HTMLButtonElement>('form button[type="submit"]')!.click();
    fixture.detectChanges();

    expect(el.querySelector('.error')?.textContent).toContain(
      "L'entreprise et le poste sont obligatoires (2 caractères minimum).",
    );
    http.expectNone({ method: 'POST' });
  });

  it('crée une candidature puis recharge la liste', async () => {
    const { fixture, el } = await render();
    type(el, 'company', 'Capgemini');
    type(el, 'position', 'Développeur fullstack');
    el.querySelector<HTMLButtonElement>('form button[type="submit"]')!.click();

    const post = http.expectOne({ method: 'POST', url: '/api/applications' });
    expect(post.request.body).toEqual({
      company: 'Capgemini',
      position: 'Développeur fullstack',
      offerUrl: null,
      status: 'TO_APPLY',
      appliedAt: null,
      notes: null,
    });
    post.flush(CAPGEMINI);
    http.expectOne({ method: 'GET', url: '/api/applications' }).flush([CAPGEMINI]);
    fixture.detectChanges();

    expect(cells(rows(el)[0])[0]).toBe('Capgemini');
  });

  it("affiche le message d'erreur renvoyé par l'API", async () => {
    const { fixture, el } = await render();
    type(el, 'company', 'Sopra Steria');
    type(el, 'position', 'Consultant');
    el.querySelector<HTMLButtonElement>('form button[type="submit"]')!.click();

    http
      .expectOne({ method: 'POST', url: '/api/applications' })
      .flush(
        { message: ["La date d'envoi est obligatoire"] },
        { status: 400, statusText: 'Bad Request' },
      );
    fixture.detectChanges();

    expect(el.querySelector('.error')?.textContent).toContain("La date d'envoi est obligatoire");
  });

  it('modifie une candidature existante, puis permet d’annuler', async () => {
    const { fixture, el } = await render([CAPGEMINI]);
    button(rows(el)[0], 'Modifier').click();
    fixture.detectChanges();

    expect(input(el, 'company').value).toBe('Capgemini');
    expect(input(el, 'appliedAt').value).toBe('2026-11-20');
    expect(el.querySelector('form button[type="submit"]')?.textContent).toContain('Enregistrer');

    button(el, 'Annuler').click();
    fixture.detectChanges();
    expect(input(el, 'company').value).toBe('');
    expect(el.querySelector('form button[type="submit"]')?.textContent).toContain('Ajouter');
  });

  it('déconnecte puis renvoie vers la page de connexion', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const { fixture, el } = await render();
    button(el, 'Se déconnecter').click();
    await fixture.whenStable();

    expect(auth.logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
