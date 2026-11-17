import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Copy, Github, Mail, MessageCircle, Phone, Send, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { contact, filterSkills, levelLabel, manifesto, roadmap, skillCategories, skills, type Skill, type SkillCategory } from "../content";
import { createWorld, dragTo, grab, release, shake, step, type World } from "../sim/badges";
import { useCamp } from "../store";
import { cn } from "@/lib/utils";

const CAT_COLOR: Record<SkillCategory, string> = {
  Linguagens: "var(--ember)",
  "Front-end": "var(--aurora)",
  "Back-end": "var(--aurora-violet)",
  Ferramentas: "var(--sky)",
  Design: "var(--rose)",
};

const catStyle = (c: SkillCategory) => ({ ["--cat" as string]: CAT_COLOR[c] }) as CSSProperties;

/* ---------------- Manifesto ---------------- */

export function ManifestoSection() {
  return (
    <article className="space-y-6">
      <h3 className="font-display text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-[2.1rem]">
        {manifesto.title.split("língua")[0]}
        <em className="text-gradient-ember font-normal">língua</em>
        {manifesto.title.split("língua")[1]}
      </h3>
      <div className="space-y-4 text-[0.97rem] leading-relaxed text-foreground/85">
        {manifesto.paragraphs.map((p, i) => (
          <p key={i} className={cn(i === 0 && "drop-cap")}>
            {p}
          </p>
        ))}
      </div>
      <dl className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3">
        {manifesto.facts.map((f) => (
          <div key={f.label} className="bg-card/80 p-4">
            <dt className="font-mono text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">{f.label}</dt>
            <dd className="mt-1.5 text-sm leading-snug font-medium">{f.value}</dd>
          </div>
        ))}
      </dl>
      <p className="font-display text-2xl text-ember italic">— {manifesto.signature}</p>
    </article>
  );
}

/* ---------------- Skills ---------------- */

const BOX_H = 210;

function BadgePlayground({ list }: { list: Skill[] }) {
  const box = useRef<HTMLDivElement>(null);
  const els = useRef<Record<string, HTMLDivElement | null>>({});
  const world = useRef<World | null>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; last: number } | null>(null);
  const key = list.map((s) => s.id).join(",");

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const sizes = list.map((s) => {
      const b = els.current[s.id];
      return { id: s.id, w: b?.offsetWidth ?? 120, h: b?.offsetHeight ?? 36 };
    });
    world.current = createWorld(el.clientWidth, BOX_H, sizes, 7);
    let raf = 0;
    let last = performance.now();
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e?.isIntersecting ?? true;
    });
    io.observe(el);
    const ro = new ResizeObserver(() => {
      if (world.current) world.current.width = el.clientWidth;
    });
    ro.observe(el);
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const w = world.current;
      if (w && visible) {
        step(w, dt);
        for (const b of w.bodies) {
          const node = els.current[b.id];
          if (node) node.style.transform = `translate(${b.x - b.w / 2}px, ${b.y - b.h / 2}px) rotate(${Math.max(-8, Math.min(8, b.vx * 0.004))}deg)`;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const local = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div className="relative">
      <div
        ref={box}
        className="relative touch-none overflow-hidden rounded-2xl border bg-[radial-gradient(ellipse_at_bottom,color-mix(in_oklab,var(--ember)_14%,transparent),transparent_70%)]"
        style={{ height: BOX_H }}
        aria-label="Badges de habilidades interativos: arraste e arremesse"
      >
        {list.map((s) => (
          <div
            key={s.id}
            ref={(n) => {
              els.current[s.id] = n;
            }}
            style={{ ...catStyle(s.category), transform: "translate(-999px,-999px)" }}
            className="absolute top-0 left-0 flex cursor-grab items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--cat)_45%,transparent)] bg-card py-1.5 pr-3 pl-1.5 text-sm font-semibold whitespace-nowrap shadow-lg select-none will-change-transform active:cursor-grabbing"
            onPointerDown={(e) => {
              const w = world.current;
              const b = w?.bodies.find((x) => x.id === s.id);
              if (!w || !b) return;
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              const p = local(e);
              drag.current = { id: s.id, dx: p.x - b.x, dy: p.y - b.y, last: performance.now() };
              grab(w, s.id);
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d || d.id !== s.id || !world.current) return;
              const p = local(e);
              const now = performance.now();
              dragTo(world.current, s.id, p.x - d.dx, p.y - d.dy, (now - d.last) / 1000);
              d.last = now;
            }}
            onPointerUp={() => {
              if (world.current && drag.current) release(world.current, drag.current.id);
              drag.current = null;
            }}
          >
            <span
              className="grid size-7 place-items-center rounded-full font-mono text-[0.62rem] text-background"
              style={{ background: `conic-gradient(var(--cat) ${s.level * 3.6}deg, color-mix(in oklab, var(--cat) 25%, transparent) 0)` }}
            >
              <span className="grid size-5 place-items-center rounded-full bg-card text-[color:var(--cat)]">{s.level}</span>
            </span>
            {s.name}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => world.current && shake(world.current)}
        className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-2.5 py-1 font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase backdrop-blur transition hover:border-ember/50 hover:text-ember"
      >
        <Shuffle className="size-3" /> Agitar
      </button>
    </div>
  );
}

export function SkillsSection() {
  const [cat, setCat] = useState<SkillCategory | "Todas">("Todas");
  const [mounted, setMounted] = useState(false);
  const list = filterSkills(skills, cat);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-5">
      <p className="text-[0.95rem] leading-relaxed text-foreground/80">
        Tudo o que carrego na mochila de trilha. Arraste, arremesse e empilhe as ferramentas — o anel ao redor de cada número indica a proficiência.
      </p>
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar por categoria">
        {(["Todas", ...skillCategories] as const).map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={cat === c}
            onClick={() => setCat(c)}
            style={c === "Todas" ? undefined : catStyle(c)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              cat === c
                ? "border-transparent bg-foreground text-background"
                : "text-muted-foreground hover:border-[color:var(--cat,var(--ember))] hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <BadgePlayground list={list} />
      <ul className="space-y-3.5">
        {list.map((s, i) => (
          <li key={s.id} style={{ ...catStyle(s.category), animationDelay: `${i * 50}ms` }} className="rise">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold">{s.name}</span>
                <span className="font-mono text-[0.62rem] tracking-wider text-muted-foreground uppercase">{s.category}</span>
              </div>
              <span className="font-mono text-xs text-[color:var(--cat)]">
                {levelLabel(s.level)} · {s.level}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-out"
                style={{ width: mounted ? `${s.level}%` : "0%", background: "linear-gradient(90deg, color-mix(in oklab, var(--cat) 50%, transparent), var(--cat))", transitionDelay: `${i * 60}ms` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Roadmap ---------------- */

const STAR_COLOR = { now: "var(--ember)", exploring: "var(--aurora)", future: "var(--aurora-violet)" } as const;

export function RoadmapSection() {
  const setHighlight = useCamp((s) => s.setHighlight);
  const highlight = useCamp((s) => s.highlight);
  return (
    <div className="space-y-5">
      <p className="text-[0.95rem] leading-relaxed text-foreground/80">
        Navegantes se orientavam pelas estrelas. Eu me oriento por três constelações: o que já domino, o que estou explorando e para onde quero ir.
      </p>
      <ol className="relative space-y-4 before:absolute before:top-3 before:bottom-3 before:left-[0.6rem] before:w-px before:bg-gradient-to-b before:from-ember before:via-aurora before:to-aurora-violet">
        {roadmap.map((c) => (
          <li
            key={c.id}
            className="relative pl-8"
            onMouseEnter={() => setHighlight(c.id)}
            onMouseLeave={() => setHighlight(null)}
            onFocus={() => setHighlight(c.id)}
            onBlur={() => setHighlight(null)}
            style={{ ["--star" as string]: STAR_COLOR[c.id] } as CSSProperties}
          >
            <span className="absolute top-2.5 left-0 grid size-5 place-items-center rounded-full border border-[color:var(--star)] bg-background">
              <span className="size-2 rounded-full bg-[color:var(--star)] shadow-[0_0_12px_var(--star)]" />
            </span>
            <div
              tabIndex={0}
              className={cn(
                "rounded-2xl border bg-card/60 p-4 transition outline-none",
                highlight === c.id ? "border-[color:var(--star)] bg-card" : "hover:border-[color-mix(in_oklab,var(--star)_50%,transparent)]",
              )}
            >
              <p className="font-mono text-[0.62rem] tracking-[0.2em] text-[color:var(--star)] uppercase">{c.stage}</p>
              <h4 className="mt-1 font-display text-xl italic">{c.name}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              <ul className="mt-3 grid gap-x-3 gap-y-2 sm:grid-cols-2">
                {c.stars.map((s) => (
                  <li key={s.label} className="flex gap-2 text-sm">
                    <span className="mt-1.5 text-[0.5rem] text-[color:var(--star)]">✦</span>
                    <span>
                      <span className="font-semibold">{s.label}</span>
                      <span className="block text-xs text-muted-foreground">{s.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------------- Contact ---------------- */

const schema = z.object({
  name: z.string().trim().min(2, "Conte-me seu nome."),
  email: z.string().trim().email("Esse e-mail parece incompleto."),
  message: z.string().trim().min(10, "Escreva ao menos uma frase curta."),
});

export function ContactSection() {
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values, string>>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(values);
    if (!r.success) {
      const errs: typeof errors = {};
      for (const i of r.error.issues) errs[i.path[0] as keyof typeof values] = i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    const subject = encodeURIComponent(`Contato pelo portfólio — ${r.data.name}`);
    const body = encodeURIComponent(`${r.data.message}\n\n— ${r.data.name} (${r.data.email})`);
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
    toast.success("Mensagem pronta!", { description: "Seu aplicativo de e-mail foi aberto com tudo preenchido." });
  };

  const field = "w-full rounded-xl border bg-background/50 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-ember/60 focus:ring-2 focus:ring-ring/30";

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl border border-aurora/30 bg-aurora/5 p-4">
        <span className="relative mt-1 flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-aurora opacity-70" />
          <span className="relative inline-flex size-2.5 rounded-full bg-aurora" />
        </span>
        <div>
          <p className="font-semibold text-aurora">{contact.status}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{contact.statusDetail}</p>
        </div>
      </div>

      <form onSubmit={submit} noValidate className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="font-mono text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">Nome</span>
            <input className={field} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="Como posso te chamar?" autoComplete="name" />
            {errors.name && <span className="text-xs text-destructive">{errors.name}</span>}
          </label>
          <label className="space-y-1">
            <span className="font-mono text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">E-mail</span>
            <input className={field} type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} placeholder="voce@exemplo.com" autoComplete="email" />
            {errors.email && <span className="text-xs text-destructive">{errors.email}</span>}
          </label>
        </div>
        <label className="block space-y-1">
          <span className="font-mono text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">Mensagem</span>
          <textarea className={cn(field, "min-h-28 resize-y")} value={values.message} onChange={(e) => setValues({ ...values, message: e.target.value })} placeholder="Uma ideia, uma vaga de estágio, um projeto..." />
          {errors.message && <span className="text-xs text-destructive">{errors.message}</span>}
        </label>
        <button
          type="submit"
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-ember)] px-4 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-ember)] transition hover:brightness-110 active:scale-[0.99]"
        >
          Enviar mensagem <Send className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </form>

      <div className="grid gap-2 sm:grid-cols-3">
        <a href={contact.github} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl border bg-card/60 px-3.5 py-3 text-sm font-semibold transition hover:border-foreground/40 hover:bg-card">
          <Github className="size-4" /> GitHub
        </a>
        <a href={contact.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl border bg-card/60 px-3.5 py-3 text-sm font-semibold transition hover:border-sky/60 hover:bg-card">
          <Linkedin className="size-4" /> LinkedIn
        </a>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(contact.email);
            toast("E-mail copiado", { description: contact.email });
          }}
          className="flex items-center gap-2.5 rounded-xl border bg-card/60 px-3.5 py-3 text-left text-sm font-semibold transition hover:border-ember/60 hover:bg-card"
        >
          <Mail className="size-4" /> E-mail <Copy className="ml-auto size-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
