import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";
import type { UserName } from "../support/commands";

const POSITION = "Développeur fullstack";

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

Given(
  "{string} possède une candidature {string}",
  (name: UserName, company: string) => {
    cy.loginAs(name).then((token) =>
      cy
        .request({
          method: "POST",
          url: "/api/applications",
          headers: authHeader(token),
          body: { company, position: POSITION },
        })
        .then((response) =>
          cy.wrap(response.body._id).as(`candidature_${name}`),
        ),
    );
  },
);

When("je me connecte en tant que {string}", (name: UserName) => {
  cy.loginAs(name);
  cy.intercept("GET", "/api/applications").as("liste");
  cy.visit("/applications");
});

Then("ma liste de candidatures est vide", () => {
  // On attend la réponse de l'API : la liste est vide aussi avant le chargement.
  cy.wait("@liste").its("response.body").should("have.length", 0);
  cy.contains("td", "Aucune candidature pour l'instant.");
});

Given("je suis connecté en tant que {string}", (name: UserName) => {
  cy.loginAs(name);
});

When(
  "j'appelle {string} avec l'identifiant de la candidature d'alice",
  (request: string) => {
    const [method, url] = request.split(" ");
    cy.get<string>("@candidature_alice").then((id) =>
      cy.get<string>("@token").then((token) =>
        cy
          .request({
            method,
            url: url.replace("{id}", id),
            headers: authHeader(token),
            failOnStatusCode: false,
          })
          .then((response) => cy.wrap([response]).as("responses")),
      ),
    );
  },
);

When(
  "j'appelle {string} puis {string} sur la candidature d'alice",
  (firstMethod: string, secondRequest: string) => {
    const [secondMethod, url] = secondRequest.split(" ");
    cy.get<string>("@candidature_alice").then((id) =>
      cy.get<string>("@token").then((token) => {
        const call = (method: string) =>
          cy.request({
            method,
            url: url.replace("{id}", id),
            headers: authHeader(token),
            body:
              method === "PUT"
                ? { company: "Piratée", position: "Pirate" }
                : undefined,
            failOnStatusCode: false,
          });
        call(firstMethod).then((first) =>
          call(secondMethod).then((second) =>
            cy.wrap([first, second]).as("responses"),
          ),
        );
      }),
    );
  },
);

Then("la candidature {string} d'alice est inchangée", (company: string) => {
  cy.get<string>("@candidature_alice").then((id) =>
    cy.get<string>("@token_alice").then((token) =>
      cy
        .request({ url: `/api/applications/${id}`, headers: authHeader(token) })
        .its("body")
        .should("include", { company, position: POSITION }),
    ),
  );
});
