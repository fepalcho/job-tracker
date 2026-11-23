## Story Jira

<!-- Clé de la story, par exemple JOB-12. Elle relie la PR au ticket dans Jira. -->

JOB-

## Ce qui change

-

## Comment tester

1.

## Definition of Done

- [ ] Le titre de la PR commence par la clé Jira (`JOB-12 …`) ou un type (`feat:`, `fix:`, `chore:`…)
- [ ] Les critères d'acceptance Gherkin de la story sont automatisés dans un `.feature` tagué `@JOB-N`
- [ ] Le job `jira` est vert : les scénarios Cypress correspondent à la story
- [ ] Tests unitaires ajoutés ou mis à jour, couverture stable
- [ ] Lint, Prettier et build passent (job `build`)
- [ ] Tests e2e verts (job `e2e`)
- [ ] Aucun secret, `.env` ni identifiant dans le code
- [ ] README ou documentation mis à jour si le comportement change
- [ ] Vérifié sur l'environnement dev après le merge (https://job-tracker-jeremy-dev.web.app)
