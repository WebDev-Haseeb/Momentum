# Vercel Deployment Roadmap

## 1. Local verification

Run the same commands Vercel will run:

```sh
npm ci
npm run lint
npm run build
```

The build uses TanStack Start with Nitro. Nitro generates Vercel-compatible output during the Vercel build.

## 2. Vercel project settings

Use these settings when importing the repository:

- Framework preset: Other
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: leave empty
- Root directory: repository root

Do not set the output directory to `dist`. TanStack Start with Nitro is not a plain Vite SPA build, and forcing `dist` is a common cause of Vercel serving a 404 page.

## 3. Deployment flow

1. Push the cleaned repository to GitHub.
2. Import it in Vercel.
3. Confirm the Vercel build log runs `npm run build`.
4. Confirm Nitro creates Vercel build output.
5. Open `/`, `/tasks`, `/habits`, `/notes`, and `/settings` on the deployed URL.

## 4. If Vercel still shows 404

Check these first:

- The project root in Vercel points at this folder.
- The Vercel output directory is blank.
- The deployment is using `package-lock.json` and `npm ci`.
- No old Vercel project setting is overriding the build command.
