import { getInput, info, warning, setFailed } from "@actions/core"
import { getOctokit, context } from "@actions/github"
import { minimatch } from "minimatch"
import { createRequire } from "module"

const require = createRequire(import.meta.url)
const config = require("./label-config.json")

async function run() {
	const token = getInput("github-token", { required: true })
	const octokit = getOctokit(token)
	const { owner, repo } = context.repo
	const prNumber = context.payload.pull_request.number

	// Get changed files
	const { data: files } = await octokit.rest.pulls.listFiles({
		owner,
		repo,
		pull_number: prNumber,
	})

	// Match patterns to labels
	const labelsToAdd = config.labels
		.filter((labelConfig) => files.some((file) => minimatch(file.filename, labelConfig.pattern)))
		.map((labelConfig) => labelConfig.name)

	if (labelsToAdd.length === 0) {
		info("No matching labels found for changed files")
		return
	}

	info(`Labels to add: ${labelsToAdd.join(", ")}`)

	// Create labels if they don't exist
	for (const labelName of labelsToAdd) {
		const labelConfig = config.labels.find((l) => l.name === labelName)
		try {
			await octokit.rest.issues.createLabel({
				owner,
				repo,
				name: labelName,
				color: labelConfig.color,
			})
			info(`Created label: ${labelName}`)
		} catch (error) {
			// Label already exists, ignore error
			if (error.status !== 422) {
				warning(`Failed to create label ${labelName}: ${error.message}`)
			}
		}
	}

	// Add labels to PR
	await octokit.rest.issues.addLabels({
		owner,
		repo,
		issue_number: prNumber,
		labels: labelsToAdd,
	})

	info(`Successfully added labels to PR #${prNumber}`)
}

run().catch((error) => setFailed(error.message))
