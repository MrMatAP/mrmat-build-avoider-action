# MrMat Build Avoider Action

This action stops a build triggered by a push when there is a corresponding open
PR for it.

## Inputs

### github-token

**Required** Token to use for GitHub API requests.

## Outputs

### abort

Set to 'true' if the build should be aborted.

## Example usage

```yaml
uses: actions/mrmat-build-avoider-action@v1.0.0
with:
    github-token: sample-token
```

## How to build this

Run `npm install` and then `npm run bundle`.

## How to test this

### Running the action locally

> Running this action locally would require a GitHub token to be injected, so
> this does not currently work.

Create `.env` based on `.env.example`, but do not commit it to your repo. Set
values in that file to simulate execution within a GitHub Workflow and execute
`npx @github/local-action . src/main.ts .env`.

