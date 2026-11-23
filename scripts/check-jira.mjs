#!/usr/bin/env node
// Vérifie que les fichiers .feature (Cypress) sont fidèles aux critères
// d'acceptance Gherkin écrits dans les stories Jira.
//
// Pour chaque fichier e2e/cypress/e2e/*.feature portant un tag @JOB-N :
//   - lit le bloc de code Gherkin de la story JOB-N dans Jira ;
//   - ERREUR si un scénario du .feature n'existe pas dans Jira,
//     ou si ses étapes (ou le Contexte) diffèrent ;
//   - AVERTISSEMENT si un scénario Jira n'est pas automatisé.
//
// Variables d'environnement : JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN.
// Sans jeton, le script affiche un avertissement et s'arrête sans erreur.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const FEATURES_DIR = process.argv[2] ?? "e2e/cypress/e2e";
const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;

const SCENARIO =
  /^(Scénario|Scenario|Plan du scénario|Plan du Scénario):\s*(.+)$/;
const CONTEXTE = /^(Contexte|Background):/;

/** Découpe un texte Gherkin en { tags, contexte, scenarios: Map<titre, étapes> }. */
export function parseGherkin(text) {
  const result = { tags: [], contexte: [], scenarios: new Map() };
  let courant = null;
  for (const brut of text.split(/\r?\n/)) {
    const ligne = brut.trim().replace(/\s+/g, " ");
    if (!ligne || ligne.startsWith("#")) continue;
    if (ligne.startsWith("@") && !courant) {
      result.tags.push(...ligne.split(" "));
      continue;
    }
    if (ligne.startsWith("Fonctionnalité:") || ligne.startsWith("Feature:"))
      continue;
    if (CONTEXTE.test(ligne)) {
      courant = result.contexte;
      continue;
    }
    const scenario = ligne.match(SCENARIO);
    if (scenario) {
      courant = [];
      result.scenarios.set(scenario[2], courant);
      continue;
    }
    if (ligne.startsWith("@")) continue; // tags de scénario
    if (courant) courant.push(ligne);
  }
  return result;
}

/** Extrait le texte des blocs de code d'une description Jira (format ADF). */
export function extraireGherkin(adf) {
  const blocs = [];
  const parcourir = (noeud) => {
    if (!noeud) return;
    if (noeud.type === "codeBlock") {
      blocs.push((noeud.content ?? []).map((t) => t.text ?? "").join(""));
      return;
    }
    (noeud.content ?? []).forEach(parcourir);
  };
  parcourir(adf);
  return blocs.join("\n");
}

/** Compare un .feature avec la story Jira. Retourne { erreurs, avertissements }. */
export function comparer(cle, feature, jira) {
  const erreurs = [];
  const avertissements = [];
  if (jira.scenarios.size === 0) {
    erreurs.push(`${cle} : aucun bloc Gherkin trouvé dans la story Jira.`);
    return { erreurs, avertissements };
  }
  if (feature.contexte.join("\n") !== jira.contexte.join("\n")) {
    erreurs.push(`${cle} : le Contexte diffère de Jira.`);
  }
  for (const [titre, etapes] of feature.scenarios) {
    const attendu = jira.scenarios.get(titre);
    if (!attendu) {
      erreurs.push(`${cle} : le scénario « ${titre} » n'existe pas dans Jira.`);
      continue;
    }
    const max = Math.max(etapes.length, attendu.length);
    for (let i = 0; i < max; i++) {
      if (etapes[i] !== attendu[i]) {
        erreurs.push(
          `${cle} : « ${titre} », étape ${i + 1}\n` +
            `    Jira    : ${attendu[i] ?? "(absente)"}\n` +
            `    feature : ${etapes[i] ?? "(absente)"}`,
        );
        break;
      }
    }
  }
  for (const titre of jira.scenarios.keys()) {
    if (!feature.scenarios.has(titre)) {
      avertissements.push(
        `${cle} : le scénario « ${titre} » n'est pas automatisé.`,
      );
    }
  }
  return { erreurs, avertissements };
}

async function lireStory(cle) {
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString(
    "base64",
  );
  const url = `${JIRA_BASE_URL.replace(/\/$/, "")}/rest/api/3/issue/${cle}?fields=description`;
  const reponse = await fetch(url, {
    headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
  });
  if (!reponse.ok)
    throw new Error(`${cle} : Jira a répondu ${reponse.status}.`);
  const issue = await reponse.json();
  return extraireGherkin(issue.fields?.description);
}

async function main() {
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    console.log(
      "::warning::check-jira ignoré : JIRA_BASE_URL, JIRA_EMAIL ou JIRA_API_TOKEN absent.",
    );
    return;
  }
  const fichiers = (await readdir(FEATURES_DIR))
    .filter((f) => f.endsWith(".feature"))
    .sort();
  let erreurs = 0;
  for (const fichier of fichiers) {
    const feature = parseGherkin(
      await readFile(path.join(FEATURES_DIR, fichier), "utf8"),
    );
    const cles = feature.tags
      .filter((t) => /^@JOB-\d+$/.test(t))
      .map((t) => t.slice(1));
    if (cles.length === 0) {
      console.log(
        `::warning::${fichier} : aucun tag @JOB-N, fichier non vérifié.`,
      );
      continue;
    }
    for (const cle of cles) {
      let jira;
      try {
        jira = parseGherkin(await lireStory(cle));
      } catch (e) {
        console.log(`::error::${e.message}`);
        erreurs++;
        continue;
      }
      const resultat = comparer(cle, feature, jira);
      resultat.avertissements.forEach((a) => console.log(`::warning::${a}`));
      resultat.erreurs.forEach((e) =>
        console.log(`::error file=${FEATURES_DIR}/${fichier}::${e}`),
      );
      erreurs += resultat.erreurs.length;
      if (resultat.erreurs.length === 0) {
        console.log(
          `OK  ${fichier} ↔ ${cle} (${feature.scenarios.size} scénario(s) conformes)`,
        );
      }
    }
  }
  if (erreurs > 0) {
    console.log(
      `\n${erreurs} écart(s) entre Jira et les tests. Mettez à jour la story ou le .feature.`,
    );
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
