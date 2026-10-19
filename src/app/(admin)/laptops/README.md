# Laptops

- **Routes:** `/laptops` (inventory), `/laptops/new` (Add Laptop), `/laptops/[laptopId]/edit` (Edit Laptop)
- **Design:** [Figma section](https://www.figma.com/design/wWTRvKpJtFXrBomS3CxQkf/Talent-cona-Admin-Portal--Copy---Copy-?node-id=293-29068)

## Files

| File | What it is |
| --- | --- |
| `page.tsx` | Inventory page: title, Add Laptop button, `LaptopsView` |
| `layout.tsx` | Wraps every laptops page in `LaptopsProvider` so add/edit/delete show up in the list |
| `new/page.tsx`, `[laptopId]/edit/page.tsx` | Two-step Add / Edit Laptop form |
| `_components/data.ts` | Types, seed inventory and select options (swap for the API later) |
| `_components/LaptopsStore.tsx` | In-memory store shared by the pages (resets on reload) |
| `_components/LaptopsView.tsx` | Search, filters, sort, table and delete confirmation |
| `_components/LaptopWizard.tsx` | Basic Details → Specifications form with progress bar |
| `_components/LaptopFormPages.tsx` | Connects the wizard to the store for add and edit |

Only edit files inside this folder. Stuff shared by several modules goes in `src/components/` — tell the team before changing it.
