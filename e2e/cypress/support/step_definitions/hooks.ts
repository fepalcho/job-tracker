import { Before } from "@badeball/cypress-cucumber-preprocessor";

// Avant chaque scénario : base vide et aucun compte dans l'émulateur.
Before(() => {
  cy.task("db:reset");
  cy.request(
    "DELETE",
    `${Cypress.expose("authEmulator")}/emulator/v1/projects/${Cypress.expose("firebaseProjectId")}/accounts`,
  );
});
