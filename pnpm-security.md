# pnpm security quick guide

## Install pnpm 11 (Linux, user scope)
Option A (recommended if you already have Node.js with Corepack):

```
corepack enable
corepack prepare pnpm@11.0.0 --activate
pnpm --version
```

Option B (classic global install):

```
npm install -g pnpm@11
pnpm --version
```

## Zsh alias to route npm -> pnpm
Add this to your ~/.zshrc:

```
alias npm=pnpm
```

Then reload your shell:

```
source ~/.zshrc
```

Note: this only affects interactive shell usage. Tooling that calls npm directly will still use npm unless you configure it separately.

## Supply chain protection (pnpm defaults and config)
The following settings harden installs by default in pnpm, but you can set them explicitly in a project .npmrc if desired.

Recommended .npmrc snippet (documented only):

```
minimumReleaseAge=1440
blockExoticSubDeps=true
```

What they do:
- minimumReleaseAge: delays new package releases until they are at least N minutes old.
- blockExoticSubDeps: blocks dependency specs that point to git or remote tarballs ("exotic" URLs).

## Additional safety tips
- Prefer lockfile installs: use "pnpm install --frozen-lockfile" in CI.
- Keep the lockfile in version control and review changes.
- Use a private registry mirror if your org requires extra control.
- Keep Node.js and pnpm updated to receive security fixes.

## Common commands mapping
- npm install -> pnpm install
- npm ci -> pnpm install --frozen-lockfile
- npx -> pnpm dlx (not aliased here)
