# Talent Cona Admin Portal

Next.js (App Router) + TypeScript + Tailwind CSS.


## Getting started

```bash
git clone https://github.com/idrisogungbo/talentcona-admin.git
cd talentcona-admin
git checkout Int-Code
npm install
npm run dev        # http://localhost:3000
```

## Who works where

Each module has its own folder under `src/app/(admin)/`. **Only edit your own folder.**
Each folder has a `README.md` with its route and Figma link.

| Module | Folder / route |
| --- | --- |
| Dashboard | `dashboard` |
| User Management | `user-management` |
| Admin Management | `admin-management` |
| Admissions & Routing | `admissions-routing` |
| Manage Programs | `manage-programs` |
| Talent Corner | `talent-corner` |
| Financial Ops | `financial-ops` |
| Laptops | `laptops` |
| Communities | `communities` |
| Referrals | `referrals` |
| Reports & Insights | `reports-insights` |

The header and sidebar (`src/components/layout/`) and the admin layout are shared. Don't change them without telling the team.

## Branch workflow

`Int-Code` is the team's integration branch. Never commit directly to it; always use a feature branch and a pull request.

```bash
# 1. Start from the latest Int-Code
git checkout Int-Code
git pull origin Int-Code

# 2. Create your branch (one per module)
git checkout -b feature/<your-module>        # e.g. feature/laptops

# 3. Work, then commit
git add .
git commit -m "laptops: build laptop list table"

# 4. Push your branch
git push -u origin feature/<your-module>

# 5. On GitHub open a Pull Request: feature/<your-module> → Int-Code
```

To keep your branch up to date while you work:

```bash
git checkout Int-Code && git pull origin Int-Code
git checkout feature/<your-module> && git merge Int-Code
```

## Sidebar menu

Menu items live in `src/config/navigation.ts`. They are **disabled** (not clickable) until your module is ready.
When it's ready, set `enabled: true` on your item only. While you work, you can open your page directly by its URL (e.g. `http://localhost:3000/laptops`).

## Conventions

- Colors: use the Tailwind tokens from `src/app/globals.css` (`bg-primary`, `bg-danger`, `text-success`, …) instead of hex values.
- Font: Outfit (already set globally).
- Icons: `import { Icon } from "@iconify/react"`. In Figma, an icon's layer name is its Iconify name (e.g. `solar:user-linear`).
- Before pushing, run `npm run lint` and `npm run build`.
