import { Then, When } from "@badeball/cypress-cucumber-preprocessor";

// Étapes partagées entre plusieurs features. Les réponses HTTP sont rangées
// dans l'alias @responses ; "la réponse a le code" les vérifie toutes.

When("j'appelle {string} sans jeton", (request: string) => {
  const [method, url] = request.split(" ");
  cy.request({ method, url, failOnStatusCode: false }).then((response) => {
    cy.wrap([response]).as("responses");
  });
});

Then("la réponse a le code {int}", (code: number) => {
  cy.get<Cypress.Response<unknown>[]>("@responses").then((responses) => {
    expect(responses, "réponses HTTP").to.have.length.greaterThan(0);
    responses.forEach((r) => expect(r.status, "code HTTP").to.eq(code));
  });
});
