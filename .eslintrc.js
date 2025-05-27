module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
    },
    extends: [
        "plugin:@typescript-eslint/recommended",
        "prettier",
        "plugin:prettier/recommended",
    ],
    rules: {
        // Custom rules
        "@typescript-eslint/explicit-function-return-type": [
            "error",
            { allowExpressions: true },
        ],
        "@typescript-eslint/no-unused-vars": [
            "error",
            { argsIgnorePattern: "^_" },
        ],
        "no-console": ["warn", { allow: ["warn", "error"] }],
        "prettier/prettier": "error",
    },
    env: {
        node: true,
    },
};
