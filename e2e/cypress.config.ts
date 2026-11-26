import { defineConfig } from "cypress";
import createBundler from "@bahmutov/cypress-esbuild-preprocessor";
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import { createEsbuildPlugin } from "@badeball/cypress-cucumber-preprocessor/esbuild";
import { MongoClient } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/jobtracker";

/** Garde-fou : les tests vident la base, ils ne doivent jamais viser une base distante. */
function assertLocalDatabase(uri: string) {
  const host = new URL(uri).hostname;
  if (!["localhost", "127.0.0.1"].includes(host)) {
    throw new Error(
      `Refus de vider la base "${host}" : les tests e2e n'acceptent qu'une base MongoDB locale.`,
    );
  }
}

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:4200",
    specPattern: "cypress/e2e/**/*.feature",
    supportFile: "cypress/support/e2e.ts",
    expose: {
      authEmulator: "http://127.0.0.1:9099",
      firebaseProjectId: "demo-e2e",
    },
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on(
        "file:preprocessor",
        createBundler({ plugins: [createEsbuildPlugin(config)] }),
      );
      on("task", {
        async "db:reset"() {
          assertLocalDatabase(MONGODB_URI);
          const client = await MongoClient.connect(MONGODB_URI);
          try {
            await client.db().collection("applications").deleteMany({});
          } finally {
            await client.close();
          }
          return null;
        },
      });
      return config;
    },
  },
});
