import * as core from '@actions/core'
import * as github from '@actions/github'

export async function run(): Promise<void> {
    try {
        const github_token: string = core.getInput('github-token')
        const gh = github.getOctokit(github_token)
        const repo = github.context.repo
        const open_prs = await gh.rest.pulls.list({
            owner: repo.owner,
            repo: repo.repo,
            state: 'open',
            head: github.context.ref
        })
        if (github.context.eventName === 'push' && open_prs.data.length > 0) {
            core.info('Found an open pull request. Skipping build on push')
            core.setOutput('abort', true)
            return
        }
        core.info('Continuing with build')
        core.setOutput('abort', false)
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}
