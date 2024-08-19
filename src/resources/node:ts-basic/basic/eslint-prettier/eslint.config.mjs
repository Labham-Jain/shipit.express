import globals from "globals";

/** @type {import("eslint").Linter.Config} */
export default [{
    languageOptions: {
        globals: {
            ...globals.node
        },

        ecmaVersion: "latest",
        sourceType: "commonjs",
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended",
        "plugin:import/recommended",
    ],
    rules: {
        indent: ["error", 2],
        quotes: ["error", "single"],
        semi: ["error", "always"],
        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
        "prettier/prettier": ["error"]
    },
}];