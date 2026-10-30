# PixelPerfect — Northstar Finance — Cloudflare Pages

Preparation only. No Cloudflare project or deployment has been created.

## Build settings

| Setting | Value |
| --- | --- |
| Intended GitHub repository | `petarpipi/pixelperfect` (creation and push await approval) |
| Framework | React, TypeScript, React Router and Vite |
| Preset | React (Vite), with the exact settings below |
| Root directory | Leave empty (repository root) |
| Build command | `pnpm install --frozen-lockfile && pnpm run build` |
| Output directory | `dist` |
| Production branch | `main` for the planned standalone repository; confirm the actual branch after publication |
| Required application variables or secrets | None |

Set these **build environment variables** in both Production and Preview:

| Name | Value | Purpose |
| --- | --- | --- |
| `NODE_VERSION` | `24.22.1` | Match the verified runtime and committed .node-version |
| `PNPM_VERSION` | `11.25.0` | Match packageManager and the lockfile |
| `SKIP_DEPENDENCY_INSTALL` | `1` | Let the build command explicitly perform the frozen install |

## Connect after GitHub publication is approved

1. In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git**.
2. Authorize the Cloudflare GitHub application for the intended repository and select it.
3. Enter the production branch, root directory, build command, output directory and build variables above. Do not use the original numbered workspace folder as the root: this is a standalone repository.
4. Review the settings. **Save and Deploy triggers a deployment**; perform that action only when deployment is separately authorized.
5. After an authorized first deployment, check the home page, local assets, interactive controls and direct refresh of client routes. Git integration then builds subsequent pushes automatically according to branch controls.

## Routing and hosting

Cloudflare Pages supplies an SPA fallback when the output has no top-level `404.html`. The current output follows that convention, so direct route navigation can load `index.html`. No added redirect or application code change is required. Keep this behavior if future routes are added.

Existing `vercel.json` files, where present, are retained for portability; Cloudflare does not apply their headers or rewrites. If custom headers are wanted later, configure a reviewed Pages `_headers` file. This preparation adds no caching or CSP changes.

## Public repository contents

Commit the source, local assets, package manifest, `pnpm-lock.yaml`, build configuration and documentation. Exclude dependencies, generated builds, environment files, local credentials and raw machine-specific QA results. A Vite browser bundle is public: never put secrets into frontend environment variables. No API key is required to build or use this demo.

## Official references

- [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Build image and version overrides](https://developers.cloudflare.com/pages/configuration/build-image/)
- [SPA serving behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/)
