import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Flame, Telescope, Tent, Toolbox } from "lucide-react";
import { behindTheScenes, profile, sections } from "@/portfolio/content";
import { ContactSection, ManifestoSection, RoadmapSection, SkillsSection } from "@/portfolio/ui/sections";

export const Route = createFileRoute("/leitura")({
  head: () => ({
    meta: [
      { title: "Pedro Henrique — Portfólio em texto" },
      { name: "description", content: "Versão em texto do portfólio de Pedro Henrique Lamin Barbosa Ciriaco: manifesto, habilidades, roadmap de aprendizado e contato." },
      { property: "og:title", content: "Pedro Henrique — Portfólio em texto" },
      { property: "og:description", content: "Manifesto, habilidades, roadmap e contato de Pedro Henrique, desenvolvedor de software e estudante da ETEC." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reading,
});

const ICONS = { fire: Flame, skills: Toolbox, sky: Telescope, tent: Tent } as const;

function Reading() {
  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--aurora)_10%,transparent),transparent_55%)]">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition hover:border-ember/60">
            <ArrowLeft className="size-4" /> Voltar ao acampamento 3D
          </Link>
          <nav className="hidden gap-1 md:flex" aria-label="Seções">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground">
                {s.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        <section className="py-20 sm:py-28">
          <p className="font-mono text-[0.7rem] tracking-[0.28em] text-ember uppercase">{profile.school}</p>
          <h1 className="mt-5 font-display text-5xl leading-[1] font-light tracking-tight sm:text-7xl">
            Pedro <em className="text-gradient-ember font-normal">Henrique</em>
            <span className="mt-3 block text-2xl text-foreground/70 sm:text-3xl">Lamin Barbosa Ciriaco</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/80">
            {profile.role}, {profile.age} anos. <span className="font-display italic">{profile.tagline}</span>
          </p>
        </section>

        {sections.map((s) => {
          const Icon = ICONS[s.id];
          return (
            <section key={s.id} id={s.id} className="grid scroll-mt-20 gap-8 border-t py-16 md:grid-cols-[220px_1fr]">
              <div>
                <span className="grid size-11 place-items-center rounded-2xl border bg-card text-ember">
                  <Icon className="size-5" />
                </span>
                <p className="mt-4 font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
                  {s.index} · {s.place}
                </p>
                <h2 className="mt-1 font-display text-3xl">{s.title}</h2>
              </div>
              <div className="max-w-2xl">
                {s.id === "fire" && <ManifestoSection />}
                {s.id === "skills" && <SkillsSection />}
                {s.id === "sky" && <RoadmapSection />}
                {s.id === "tent" && <ContactSection />}
              </div>
            </section>
          );
        })}

        <section className="border-t py-16">
          <p className="font-mono text-[0.65rem] tracking-[0.2em] text-aurora uppercase">Bastidores técnicos</p>
          <h2 className="mt-1 font-display text-3xl">Como este acampamento foi construído</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">Este site é o próprio projeto do portfólio. Algumas das decisões por trás dele:</p>
          <div className="mt-8 grid gap-px overflow-hidden rounded-3xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {behindTheScenes.map((b) => (
              <div key={b.title} className="bg-card/80 p-6">
                <h3 className="font-semibold">{b.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-10 text-center text-sm text-muted-foreground">
        Feito com cuidado por {profile.name}. Modelos 3D: Kenney (CC0).
      </footer>
    </div>
  );
}
