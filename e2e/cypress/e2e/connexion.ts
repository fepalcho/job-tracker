import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';

Given('je ne suis pas connecté', () => {
  // Cypress démarre chaque test avec un navigateur vierge : rien à faire.
});

When("j'ouvre la page {string}", (path: string) => {
  cy.visit(path);
});

Then('je suis redirigé vers {string}', (path: string) => {
  cy.location('pathname').should('eq', path);
});

When("j'appelle {string} sans jeton", (request: string) => {
  const [method, url] = request.split(' ');
  cy.request({ method, url, failOnStatusCode: false }).as('response');
});

Then('la réponse a le code {int}', (code: number) => {
  cy.get('@response').its('status').should('eq', code);
});