const raycastConfig = require("@raycast/eslint-config");

// Flatten in case any imported configs are arrays (e.g., prettier flat config)
const baseConfigs = raycastConfig.flatMap((config) =>
  Array.isArray(config) ? config : [config]
);

module.exports = [
  ...baseConfigs,
  {
    files: ["**/*.test.ts", "**/__mocks__/**", "**/__tests__/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];
