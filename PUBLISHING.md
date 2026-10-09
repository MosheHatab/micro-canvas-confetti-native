# Publish this library

Starter for anyone who clones this repo and wants it on npm under their own name. Do the steps in order. The first release is from your machine. Later releases go through GitHub.

Replace these before you start:

| In the template | Change it to |
| --- | --- |
| `package.json` → `"name"` | your npm package name |
| `package.json` → `"repository"`, `"author"` | your GitHub repo and name |
| `MosheHatab/micro-canvas-confetti-native` below | `YOUR_USER/YOUR_REPO` |

The version already in `package.json` is what the first publish ships. This template starts at `0.1.0`.

## 1. First publish, from your machine

GitHub is not involved yet. `npm login` stores a token on your computer only.

```sh
npm login
npm install
npm test
npm run build
npm publish --access public
```

`npm publish` uploads the version in `package.json`. Confirm it on `https://www.npmjs.com/package/YOUR_PACKAGE_NAME`.

Then put the code on GitHub and push `main`. That push runs tests. It does not publish again, because this version is already on npm.

## 2. Let GitHub publish the next versions

Actions runs on a clean machine. It cannot see the `npm login` on your PC. You connect npm to the repo once.

### 2a. Allow the version pull request

GitHub repo → **Settings** → **Actions** → **General** → **Workflow permissions** → **Read and write permissions**.

You do not create a GitHub personal access token. Actions already has `GITHUB_TOKEN` for each run. That setting is what lets `.github/workflows/release.yml` open the **Version Packages** pull request.

### 2b. Give Actions a way to log in to npm

Pick one.

**Token.** Use this if you want Actions to publish with an npm token.

1. [npmjs.com](https://www.npmjs.com) → **Access Tokens** → **Generate New Token** → **Automation**.
2. GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
3. Name: `NPM_TOKEN`. Value: the token from step 1.

The workflow already contains:

```yaml
NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

The secret name must be `NPM_TOKEN`. Pushing code does not copy your local npm token into that secret. You paste it once.

**Trusted publisher.** Use this if you do not want a token stored on GitHub.

On the npm package → **Settings** → **Trusted Publisher**:

- Repository: `YOUR_USER/YOUR_REPO`
- Workflow filename: `release.yml`

Leave `NPM_TOKEN` empty. GitHub proves it is this repo. The workflow already asks for `id-token: write`.

## 3. Every version after the first one

From the repo root:

```sh
npx changeset
```

Select this package, pick the bump, and write a one-line summary.

| Choice | From `0.1.0` |
| --- | --- |
| patch | `0.1.1` |
| minor | `0.2.0` |
| major | `1.0.0` |

For `1.0.0`, choose **major** and confirm the first major release. Summary example: `First stable release.`

Commit the new file under `.changeset/` and push to `main`.

GitHub opens a **Version Packages** pull request. That PR bumps `package.json` and writes `CHANGELOG.md`. Merging it publishes to npm.

A push with no new changeset file only runs tests. The release job sees the current version already on npm and stops.

## 4. Publish a version from your machine anyway

Same npm login as step 1. GitHub will not publish it a second time after you push.

```sh
npx changeset
npx changeset version
npm run release
git add -A
git commit -m "Release VERSION"
git push
```

`npx changeset version` writes the new number into `package.json` before `npm run release` publishes it.
