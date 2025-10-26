import * as core from '@actions/core'
import * as github from '@actions/github'

export async function run(): Promise<void> {
    try {
        const github_token: string = core.getInput('github-token')
        const ref = github.context.ref
        const gh = github.getOctokit(github_token)
        const repo = github.context.repo
        const open_prs = await gh.rest.pulls.list({
            owner: repo.owner,
            repo: repo.repo,
            state: 'open',
            head: ref
        })

        core.info(`Building on ${ref}`)
        if (github.context.eventName === 'push' && open_prs.data.length === 0) {
            core.info('No open pull requests found. Continuing with build')
            core.setOutput('abort', false)
            return
        }
        open_prs.data.forEach((pr) => {
            core.info(
                `Found open pull request ${pr.number}:${pr.title} with head ref ${pr.head.ref}`
            )
            if (pr.head.ref === ref) {
                core.info(
                    `Found open PR ${pr.number} with head ${ref}. Debouncing this push build.`
                )
                core.setOutput('abort', true)
                return
            }
        })

        core.info('No pull requests to debounce found. Continuing with build')
        core.info('Test')
        core.setOutput('abort', false)
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}
