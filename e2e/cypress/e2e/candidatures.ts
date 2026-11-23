import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";

const submit = () => cy.get('form button[type="submit"]').click();
const field = (name: string) => cy.get(`[formcontrolname="${name}"]`);

Given("je suis connecté", () => {
  cy.loginAs("alice");
  cy.visit("/applications");
});

When(
  "je crée une candidature pour l'entreprise {string} au poste {string}",
  (company: string, position: string) => {
    field("company").type(company);
    field("position").type(position);
    submit();
  },
);

Then("la candidature {string} apparaît dans ma liste", (company: string) => {
  cy.contains("tbody tr", company).as("ligne");
});

Then("son statut est {string}", (label: string) => {
  cy.get("@ligne").find("td").eq(2).should("have.text", label);
});

When("je valide le formulaire sans renseigner l'entreprise", () => {
  field("position").type("Développeur fullstack");
  submit();
});

Then("je vois le message {string}", (message: string) => {
  cy.get(".error").should("contain.text", message);
});

Then("aucune candidature n'est ajoutée", () => {
  cy.contains("td", "Aucune candidature pour l'instant.");
  cy.get<string>("@token").then((token) =>
    cy
      .request({
        url: "/api/applications",
        headers: { Authorization: `Bearer ${token}` },
      })
      .its("body")
      .should("have.length", 0),
  );
});

When(
  "je crée une candidature {string} au statut {string} sans date d'envoi",
  (company: string, status: string) => {
    field("company").type(company);
    field("position").type("Consultant");
    field("status").select(status);
    submit();
  },
);
