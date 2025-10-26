import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as github from '../__fixtures__/github.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)

const { run } = await import('../src/main.js')

describe('GitHub Actions Interface', () => {
    test.each([
        {
            repo: { owner: 'MrMat', repo: 'test' },
            eventName: 'push',
            ref: 'refs/heads/feature/foo',
            open_prs: {
                data: [
                    {
                        number: 23,
                        title: 'Awesome PR 23',
                        head: { ref: 'feature/foo' }
                    },
                    {
                        number: 24,
                        title: 'Awesome PR 24',
                        head: { ref: 'feature/awesome-24' }
                    }
                ]
            },
            expected: {
                desc: 'Can debounce a push event when there is an open pull request for the same ref',
                info: "Found open PR 23: 'Awesome PR 23' with head feature/foo. Debouncing this push build.",
                abort: true
            }
        },
        {
            repo: { owner: 'MrMat', repo: 'test' },
            eventName: 'push',
            ref: 'refs/heads/feature/foo',
            open_prs: { data: [] },
            expected: {
                desc: 'Continues the build when there are no open pull requests',
                info: 'No relevant open pull requests found. Continuing with build.',
                abort: false
            }
        },
        {
            repo: { owner: 'MrMat', repo: 'test' },
            eventName: 'pull_request',
            ref: 'refs/heads/feature/foo',
            open_prs: {
                data: [
                    {
                        number: 23,
                        title: 'Awesome PR 23',
                        head: { ref: 'feature/foo' }
                    }
                ]
            },
            expected: {
                desc: 'Builds for events other than push, even when there is a matching PR',
                info: 'Not a push event. Continuing with build.',
                abort: false
            }
        }
    ])(
        '$expected.desc',
        async ({ repo, eventName, ref, open_prs, expected }) => {
            core.getInput.mockImplementation((input: string) => {
                switch (input) {
                    case 'github-token':
                        return 'test-token'
                    default:
                        throw new Error(`Unexpected input: ${input}`)
                }
            })
            // @ts-expect-error - Mocking the getOctokit function
            github.getOctokit.mockImplementation(() => {
                return {
                    rest: {
                        pulls: {
                            list: () => open_prs
                        }
                    }
                }
            })
            github.context.repo = repo
            github.context.eventName = eventName
            github.context.ref = ref

            await run()

            expect(core.info).toHaveBeenCalledWith(expected.info)
            expect(core.setOutput).toHaveBeenNthCalledWith(
                1,
                'abort',
                expected.abort
            )
            jest.resetAllMocks()
        }
    )
})
