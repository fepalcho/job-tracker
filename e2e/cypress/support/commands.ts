/// <reference types="cypress" />

/** Faux comptes Google créés dans l'émulateur Firebase Auth. */
export const USERS = {
  alice: { sub: "alice", email: "alice@example.com", name: "Alice" },
  bob: { sub: "bob", email: "bob@example.com", name: "Bob" },
} as const;

export type UserName = keyof typeof USERS;

declare global {
  interface Window {
    e2eSignIn?: (user: {
      sub: string;
      email: string;
      name: string;
    }) => Promise<string>;
  }
  namespace Cypress {
    interface Chainable {
      /**
       * Crée (au premier appel) et connecte un faux compte Google via
       * l'émulateur, sans popup. Renvoie l'ID token, aussi disponible via
       * les alias `@token` (utilisateur courant) et `@token_<nom>`.
       */
      loginAs(name: UserName): Chainable<string>;
    }
  }
}

Cypress.Commands.add("loginAs", (name: UserName) => {
  cy.visit("/login");
  // e2eSignIn n'existe que si le front tourne avec --configuration e2e.
  cy.window().its("e2eSignIn").should("be.a", "function");
  return cy
    .window()
    .then((win) => win.e2eSignIn!(USERS[name]))
    .then((token) => {
      cy.wrap(token).as("token");
      cy.wrap(token).as(`token_${name}`);
      return cy.wrap(token);
    });
});
