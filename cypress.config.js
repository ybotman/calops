import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:3013',
  },

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
      port: 3013
    },
  },
});
