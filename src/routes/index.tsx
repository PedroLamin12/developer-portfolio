import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { Component, lazy, Suspense, type ReactNode } from "react";
import { Overlay } from "@/portfolio/ui/Overlay";

const CampScene = lazy(() => import("@/portfolio/scene/CampScene"));

// If the 3D scene fails (no WebGL, a model that can't load), keep the page and menu usable.
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: unknown) {
    console.error("Cena 3D indisponível:", error);
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pedro Henrique — Portfólio imersivo | Acampamento na Floresta" },
      {
        name: "description",
        content: "Portfólio 3D de Pedro Henrique Lamin Barbosa Ciriaco, desenvolvedor de software de 16 anos e estudante da ETEC: manifesto, habilidades, roadmap e contato ao redor de uma fogueira sob a aurora boreal.",
      },
      { property: "og:title", content: "Pedro Henrique — Portfólio imersivo" },
      { property: "og:description", content: "Uma clareira na floresta, uma fogueira e a aurora boreal: conheça o desenvolvedor Pedro Henrique em um portfólio 3D interativo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-background">
      <ClientOnly fallback={<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,color-mix(in_oklab,var(--ember)_18%,transparent),transparent_60%)]" />}>
        <SceneBoundary>
          <Suspense fallback={null}>
            <CampScene />
          </Suspense>
        </SceneBoundary>
      </ClientOnly>
      <Overlay />
    </main>
  );
}
