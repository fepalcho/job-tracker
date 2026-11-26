import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  const auth = { login: vi.fn() };

  beforeEach(async () => {
    auth.login.mockReset();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();
  });

  function render() {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function loginButton(el: HTMLElement) {
    return Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Se connecter avec Google'),
    )!;
  }

  it('affiche le titre et le bouton de connexion Google', () => {
    const { el } = render();
    expect(el.querySelector('h1')?.textContent).toContain('Suivi de candidatures');
    expect(loginButton(el)).toBeTruthy();
    expect(el.querySelector('.error')).toBeNull();
  });

  it('redirige vers la liste après une connexion réussie', async () => {
    auth.login.mockResolvedValue({});
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const { fixture, el } = render();

    loginButton(el).click();
    await fixture.whenStable();

    expect(auth.login).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/applications']);
  });

  it("affiche l'erreur si la connexion échoue", async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    auth.login.mockRejectedValue({ code: 'auth/popup-closed-by-user' });
    const { fixture, el } = render();

    loginButton(el).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.querySelector('.error')?.textContent).toContain(
      'Connexion impossible : auth/popup-closed-by-user',
    );
  });
});
