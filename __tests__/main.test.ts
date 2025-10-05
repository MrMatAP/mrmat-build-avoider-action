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
            open_prs: { data: [{ ref: 'refs/heads/feature/foo' }] },
            expected: {
                info: 'Found an open pull request. Skipping build on push',
                abort: true
            }
        },
        {
            repo: { owner: 'MrMat', repo: 'test' },
            eventName: 'push',
            ref: 'refs/heads/feature/foo',
            open_prs: { data: [] },
            expected: {
                info: 'Continuing with build',
                abort: false
            }
        },
        {
            repo: { owner: 'MrMat', repo: 'test' },
            eventName: 'pull_request',
            ref: 'refs/heads/feature/foo',
            open_prs: { data: [{ ref: 'refs/heads/feature/bar' }] },
            expected: {
                info: 'Continuing with build',
                abort: false
            }
        }
    ])(
        '%#: $expected.info for $eventName on $ref',
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

            expect(core.info).toHaveBeenNthCalledWith(1, expected.info)
            expect(core.setOutput).toHaveBeenNthCalledWith(
                1,
                'abort',
                expected.abort
            )
            jest.resetAllMocks()
        }
    )
})
