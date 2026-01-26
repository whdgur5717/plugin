import baseConfig from "@design-editor/eslint-config"

export default [
	...baseConfig,
	{
		files: ["src/main/**/*.ts"],
		languageOptions: {
			globals: { figma: "readonly", __html__: "readonly" },
		},
		rules: {
			"@typescript-eslint/triple-slash-reference": "off",
		},
	},
]
