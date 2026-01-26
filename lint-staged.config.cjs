const packages = {
	"editor-core": "@design-editor/core",
	"editor-components": "@design-editor/components",
	"editor-canvas": "@design-editor/canvas",
	"editor-shell": "@design-editor/shell",
	"figma-plugin": "@design-editor/figma-plugin",
}

const config = {}

for (const [dir, name] of Object.entries(packages)) {
	config[`packages/${dir}/**/*.{ts,tsx}`] = (files) => [
		`pnpm --filter ${name} lint ${files.join(" ")}`,
		`pnpm --filter ${name} type-check`,
	]
}

config["*"] = (files) => [`prettier --write --ignore-unknown ${files.join(" ")}`]

module.exports = config
