import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, Flame, Gauge, Headphones, Menu, Telescope, Tent, Toolbox, Volume2, VolumeX, X, Compass } from "lucide-react";
import { useCamp, perfStats, type Focus } from "../store";
import { profile, sections, type SectionId } from "../content";
import { ambience } from "../audio/ambience";
import { ContactSection, ManifestoSection, RoadmapSection, SkillsSection } from "./sections";
import { cn } from "@/lib/utils";

const ICONS: Record<SectionId, typeof Flame> = { fire: Flame, skills: Toolbox, sky: Telescope, tent: Tent };

function SectionBody({ id }: { id: SectionId }) {
  if (id === "fire") return <ManifestoSection />;
  if (id === "skills") return <SkillsSection />;
  if (id === "sky") return <RoadmapSection />;
  return <ContactSection />;
}

/* ---------------- Intro ---------------- */

function Intro() {
  const entered = useCamp((s) => s.entered);
  const ready = useCamp((s) => s.ready);
  const setFocus = useCamp((s) => s.setFocus);
  const [first, ...rest] = profile.name.split(" ");
  const restName = rest.join(" ");

  return (
    <div
      className={cn(
        "absolute inset-0 z-40 flex items-end bg-[linear-gradient(180deg,transparent_0%,color-mix(in_oklab,var(--background)_55%,transparent)_45%,var(--background)_100%)] px-6 pb-14 transition-all duration-1000 sm:items-center sm:bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_oklab,var(--background)_70%,transparent)_40%,transparent_75%)] sm:px-14 sm:pb-0 lg:px-24",
        entered && "pointer-events-none opacity-0",
      )}
      aria-hidden={entered}
    >
      <div className="max-w-xl">
        <p className="rise font-mono text-[0.7rem] tracking-[0.28em] text-ember uppercase">{profile.school}</p>
        <h1 className="rise mt-5 font-display leading-[0.95] font-light tracking-tight" style={{ animationDelay: "120ms" }}>
          <span className="block text-6xl sm:text-7xl lg:text-8xl">
            {first} <em className="text-gradient-ember font-normal">{rest[0]}</em>
          </span>
          <span className="mt-3 block text-xl text-foreground/70 sm:text-2xl">{restName.replace(rest[0] + " ", "")}</span>
        </h1>
        <p className="rise mt-6 max-w-md text-lg leading-relaxed text-foreground/80" style={{ animationDelay: "240ms" }}>
          {profile.role}, {profile.age} anos. <span className="font-display text-foreground italic">{profile.tagline}</span>
        </p>
        <div className="rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "360ms" }}>
          <button
            type="button"
            disabled={!ready}
            onClick={() => {
              ambience.start();
              ambience.setMuted(useCamp.getState().muted);
              setFocus("overview");
            }}
            className="group inline-flex items-center gap-3 rounded-full bg-[image:var(--gradient-ember)] py-3.5 pr-6 pl-3.5 font-bold text-primary-foreground shadow-[var(--shadow-ember)] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          >
            <span className="grid size-8 place-items-center rounded-full bg-primary-foreground/15">
              <Flame className={cn("size-4", ready ? "flicker" : "animate-pulse")} />
            </span>
            {ready ? "Entrar no acampamento" : "Acendendo a fogueira…"}
          </button>
          <Link to="/leitura" className="rounded-full border px-5 py-3.5 text-sm font-semibold text-foreground/80 transition hover:border-foreground/40 hover:text-foreground">
            Ler sem 3D
          </Link>
        </div>
        <p className="rise mt-6 flex items-center gap-2 text-xs text-muted-foreground" style={{ animationDelay: "480ms" }}>
          <Headphones className="size-3.5" /> Melhor com fones de ouvido · o som pode ser desligado a qualquer momento
        </p>
      </div>
    </div>
  );
}

/* ---------------- Top bar ---------------- */

function TopBar() {
  const muted = useCamp((s) => s.muted);
  const setMuted = useCamp((s) => s.setMuted);
  const entered = useCamp((s) => s.entered);
  const setFocus = useCamp((s) => s.setFocus);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-50 flex items-center justify-between p-4 sm:p-5">
      <button
        type="button"
        onClick={() => entered && setFocus("overview")}
        className={cn("pointer-events-auto flex items-center gap-3 transition-opacity duration-700", entered ? "opacity-100" : "opacity-0")}
        aria-label="Voltar à visão geral"
      >
        <span className="grid size-10 place-items-center rounded-full border bg-glass font-display text-lg italic backdrop-blur">
          <span className="text-gradient-ember">ph</span>
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm leading-tight font-semibold">{profile.shortName}</span>
          <span className="block font-mono text-[0.62rem] tracking-[0.16em] text-muted-foreground uppercase">{profile.role}</span>
        </span>
      </button>

      <div className="pointer-events-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const next = !muted;
            setMuted(next);
            ambience.start();
            ambience.setMuted(next);
          }}
          className="flex h-10 items-center gap-2 rounded-full border bg-glass px-3.5 text-sm backdrop-blur transition hover:border-foreground/30"
          aria-label={muted ? "Ativar som ambiente" : "Desativar som ambiente"}
          aria-pressed={!muted}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4 text-ember" />}
          <span className="hidden sm:inline">{muted ? "Som desligado" : "Som ambiente"}</span>
          {!muted && (
            <span className="flex h-3 items-end gap-[2px]" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-[2px] animate-pulse rounded-full bg-ember" style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 0.2}s` }} />
              ))}
            </span>
          )}
        </button>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-10 items-center gap-2 rounded-full border bg-glass px-3.5 text-sm backdrop-blur transition hover:border-foreground/30"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
            <span className="hidden sm:inline">Acesso rápido</span>
          </button>
          {open && <QuickMenu onClose={() => setOpen(false)} />}
        </div>
      </div>
    </header>
  );
}

function QuickMenu({ onClose }: { onClose: () => void }) {
  const setFocus = useCamp((s) => s.setFocus);
  const focus = useCamp((s) => s.focus);
  const toggleStats = useCamp((s) => s.toggleStats);
  const showStats = useCamp((s) => s.showStats);
  const go = (f: Focus) => {
    if (!useCamp.getState().entered) {
      ambience.start();
      ambience.setMuted(useCamp.getState().muted);
    }
    setFocus(f);
    onClose();
  };
  return (
    <div role="menu" className="glass rise absolute top-12 right-0 w-[min(20rem,calc(100vw-2rem))] rounded-2xl p-2" style={{ animationDuration: "0.35s" }}>
      <p className="px-3 pt-2 pb-1 font-mono text-[0.6rem] tracking-[0.2em] text-muted-foreground uppercase">Pontos do acampamento</p>
      {sections.map((s) => {
        const Icon = ICONS[s.id];
        return (
          <button key={s.id} role="menuitem" type="button" onClick={() => go(s.id)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-accent", focus === s.id && "bg-accent")}>
            <Icon className="size-4 text-ember" />
            <span className="flex-1">
              <span className="block text-sm font-semibold">{s.title}</span>
              <span className="block text-xs text-muted-foreground">{s.place}</span>
            </span>
            <span className="font-mono text-[0.65rem] text-muted-foreground">{s.index}</span>
          </button>
        );
      })}
      <div className="my-1.5 h-px bg-border" />
      <button role="menuitem" type="button" onClick={() => go("overview")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-accent">
        <Compass className="size-4 text-aurora" /> Visão geral da clareira
      </button>
      <Link role="menuitem" to="/leitura" onClick={onClose} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-accent">
        <BookOpen className="size-4 text-aurora" /> Ler tudo em formato de texto
      </Link>
      <button role="menuitemcheckbox" aria-checked={showStats} type="button" onClick={toggleStats} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-accent">
        <Gauge className="size-4 text-aurora-violet" /> Bastidores: desempenho ao vivo
        <span className={cn("ml-auto h-4 w-7 rounded-full p-0.5 transition", showStats ? "bg-aurora" : "bg-muted")}>
          <span className={cn("block size-3 rounded-full bg-background transition", showStats && "translate-x-3")} />
        </span>
      </button>
      <p className="px-3 pt-2 pb-1.5 text-[0.68rem] text-muted-foreground">
        Atalhos: <kbd className="font-mono">1–4</kbd> pontos · <kbd className="font-mono">Esc</kbd> voltar · <kbd className="font-mono">M</kbd> som
      </p>
    </div>
  );
}

/* ---------------- Dock ---------------- */

function Dock() {
  const focus = useCamp((s) => s.focus);
  const entered = useCamp((s) => s.entered);
  const hovered = useCamp((s) => s.hovered);
  const setFocus = useCamp((s) => s.setFocus);
  const setHovered = useCamp((s) => s.setHovered);
  const panel = focus !== "overview";
  return (
    <nav
      aria-label="Pontos de interesse"
      className={cn(
        "absolute bottom-4 left-1/2 z-30 -translate-x-1/2 transition-all duration-700 sm:bottom-6",
        entered ? "opacity-100" : "pointer-events-none translate-y-6 opacity-0",
        panel && "max-lg:pointer-events-none max-lg:translate-y-24 max-lg:opacity-0",
      )}
    >
      <ul className="glass flex items-center gap-1 rounded-full p-1.5">
        {sections.map((s) => {
          const Icon = ICONS[s.id];
          const active = focus === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setFocus(active ? "overview" : s.id)}
                onPointerEnter={() => setHovered(s.id)}
                onPointerLeave={() => setHovered(null)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "group flex items-center gap-2 rounded-full px-3.5 py-2.5 text-sm font-semibold transition",
                  active ? "bg-[image:var(--gradient-ember)] text-primary-foreground" : hovered === s.id ? "bg-accent" : "text-foreground/80 hover:bg-accent",
                )}
              >
                <Icon className="size-4" />
                <span className="hidden md:inline">{s.place.replace(/^(A|O) /, "")}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ---------------- Panel ---------------- */

function Panel() {
  const focus = useCamp((s) => s.focus);
  const setFocus = useCamp((s) => s.setFocus);
  const [shown, setShown] = useState<SectionId>("fire");
  const scroller = useRef<HTMLDivElement>(null);
  const open = focus !== "overview";
  useEffect(() => {
    if (focus !== "overview") {
      setShown(focus);
      scroller.current?.scrollTo({ top: 0 });
    }
  }, [focus]);
  const idx = sections.findIndex((s) => s.id === shown);
  const section = sections[idx];
  const prev = sections[(idx + sections.length - 1) % sections.length];
  const next = sections[(idx + 1) % sections.length];
  const Icon = ICONS[shown];

  return (
    <aside
      aria-hidden={!open}
      aria-label={section.title}
      className={cn(
        "glass fixed z-40 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        "inset-x-0 bottom-0 max-h-[64dvh] rounded-t-3xl",
        "lg:inset-x-auto lg:top-20 lg:right-5 lg:bottom-5 lg:max-h-none lg:w-[460px] lg:rounded-3xl",
        open ? "translate-y-0 opacity-100 lg:translate-x-0" : "pointer-events-none translate-y-full opacity-0 lg:translate-x-[110%] lg:translate-y-0",
      )}
    >
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-foreground/20 lg:hidden" />
      <header className="flex items-start gap-3 border-b px-5 pt-4 pb-4 sm:px-6">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl border bg-card text-ember">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[0.62rem] tracking-[0.2em] text-muted-foreground uppercase">
            {section.index} · {section.place}
          </p>
          <h2 className="mt-0.5 font-display text-2xl leading-tight">{section.title}</h2>
        </div>
        <button type="button" onClick={() => setFocus("overview")} className="grid size-9 shrink-0 place-items-center rounded-full border transition hover:border-foreground/40 hover:bg-accent" aria-label="Fechar e voltar à clareira">
          <X className="size-4" />
        </button>
      </header>
      <div ref={scroller} className="panel-scroll flex-1 overflow-y-auto px-5 py-5 sm:px-6" key={shown}>
        <div className="rise">
          <SectionBody id={shown} />
        </div>
      </div>
      <footer className="flex items-center justify-between gap-2 border-t px-4 py-3 text-sm">
        <NavButton onClick={() => setFocus(prev.id)}>
          <ArrowLeft className="size-4" /> <span className="truncate">{prev.place}</span>
        </NavButton>
        <NavButton onClick={() => setFocus(next.id)}>
          <span className="truncate">{next.place}</span> <ArrowRight className="size-4" />
        </NavButton>
      </footer>
    </aside>
  );
}

function NavButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-w-0 items-center gap-2 rounded-full px-3 py-2 text-muted-foreground transition hover:bg-accent hover:text-foreground">
      {children}
    </button>
  );
}

/* ---------------- Hints & stats ---------------- */

function Hint() {
  const entered = useCamp((s) => s.entered);
  const focus = useCamp((s) => s.focus);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!entered) return;
    const a = setTimeout(() => setVisible(true), 2600);
    const b = setTimeout(() => setVisible(false), 9500);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [entered]);
  return (
    <p
      className={cn(
        "pointer-events-none absolute bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full border bg-glass px-4 py-2 text-center text-xs whitespace-nowrap text-foreground/80 backdrop-blur transition-all duration-700 sm:bottom-28",
        visible && focus === "overview" ? "opacity-100" : "translate-y-2 opacity-0",
      )}
    >
      Arraste para orbitar · toque nos pontos de luz para explorar
    </p>
  );
}

function StatsChip() {
  const show = useCamp((s) => s.showStats);
  const [s, setS] = useState({ fps: 0, calls: 0, triangles: 0 });
  useEffect(() => {
    if (!show) return;
    const id = setInterval(() => setS({ ...perfStats }), 500);
    return () => clearInterval(id);
  }, [show]);
  if (!show) return null;
  return (
    <div className="glass absolute top-20 left-4 z-30 rounded-xl px-3 py-2 font-mono text-[0.68rem] leading-relaxed sm:left-5">
      <p className="text-aurora">{s.fps} FPS</p>
      <p className="text-muted-foreground">{s.calls} draw calls</p>
      <p className="text-muted-foreground">{(s.triangles / 1000).toFixed(1)}k triângulos</p>
    </div>
  );
}

/* ---------------- Root overlay ---------------- */

export function Overlay() {
  const focus = useCamp((s) => s.focus);
  const muted = useCamp((s) => s.muted);

  useEffect(() => {
    ambience.setFocus(focus);
  }, [focus]);
  useEffect(() => {
    ambience.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const st = useCamp.getState();
      if (e.key === "Escape") st.setFocus("overview");
      else if (["1", "2", "3", "4"].includes(e.key) && st.entered) st.setFocus(sections[Number(e.key) - 1].id);
      else if (e.key.toLowerCase() === "m" && st.entered) st.setMuted(!st.muted);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <TopBar />
      <Intro />
      <Dock />
      <Hint />
      <StatsChip />
      <Panel />
    </>
  );
}
