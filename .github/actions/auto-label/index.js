const core = require("@actions/core")
const github = require("@actions/github")
const { minimatch } = require("minimatch")
const config = require("./label-config.json")

async function run() {
	const token = core.getInput("github-token", { required: true })
	const octokit = github.getOctokit(token)
	const { owner, repo } = github.context.repo
	const prNumber = github.context.payload.pull_request.number

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
		core.info("No matching labels found for changed files")
		return
	}

	core.info(`Labels to add: ${labelsToAdd.join(", ")}`)

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
			core.info(`Created label: ${labelName}`)
		} catch (error) {
			// Label already exists, ignore error
			if (error.status !== 422) {
				core.warning(`Failed to create label ${labelName}: ${error.message}`)
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

	core.info(`Successfully added labels to PR #${prNumber}`)
}

run().catch((error) => core.setFailed(error.message))
