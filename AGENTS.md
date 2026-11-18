<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Portfolio copy (manifesto, skills, roadmap, contact) lives only in `src/portfolio/content.ts`; scene and UI read from it so text edits never touch 3D code.
- The 3D scene (`src/portfolio/scene/*`) is lazy-loaded behind `<ClientOnly>` on `/`; the overlay UI and `/leitura` stay server-rendered so content is readable without WebGL.
- Per-frame motion lives in refs/shaders (fire, embers, smoke, fireflies, sky are GPU-animated); zustand (`src/portfolio/store.ts`) holds only UI-level state.
- drei `<Html>` labels always use `portal={labelLayer}` and stay mounted (fade with CSS) — conditional mounting or the default target remounts roots and logs React unmount errors.
- Repeated GLB props (trees, rocks, grass) render through `Instances` in `scene/models.tsx` to keep draw calls low; models are Kenney CC0 files in `public/models` (see `CREDITS.md` there), referenced via `scene/modelUrls.ts` — never Lovable asset pointers, whose `/__l5e/` URLs 404 when the site is hosted outside Lovable (e.g. Vercel).
- Badge physics is pure TS in `src/portfolio/sim/badges.ts` with vitest coverage; keep it free of React/DOM.
- Deep links `/?ponto=fogueira|ferramentas|ceu|contato|clareira` open a point directly (used for presenting and visual checks).
