export default [
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      semi: "error",
      "no-unused-vars": "warn",
      "no-console": "warn"
    },
  }
];
