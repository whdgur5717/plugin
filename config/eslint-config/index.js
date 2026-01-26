import js from "@eslint/js"
import tseslint from "typescript-eslint"
import tsParser from "@typescript-eslint/parser"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import eslintConfigPrettier from "eslint-config-prettier"

export default [
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		ignores: ["node_modules/**", "dist/**", "*.config.{js,ts}"],
	},
	{
		plugins: {
			"simple-import-sort": simpleImportSort,
		},
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				projectService: true,
			},
		},
		rules: {
			"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
			"simple-import-sort/imports": "error",
			"simple-import-sort/exports": "error",
		},
	},
	eslintConfigPrettier,
]
