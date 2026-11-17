// All portfolio copy lives here so it can be edited without touching the scene.

export const profile = {
  name: "Pedro Henrique Lamin Barbosa Ciriaco",
  shortName: "Pedro Henrique",
  age: 16,
  role: "Desenvolvedor de Software",
  school: "ETEC — Técnico em Informática para Internet",
  tagline: "Escrevo código como quem escreve prosa: com intenção, ritmo e cuidado com quem vai ler.",
};

export type SectionId = "fire" | "skills" | "sky" | "tent";

export const sections: { id: SectionId; index: string; title: string; place: string; hint: string }[] = [
  { id: "fire", index: "01", title: "Manifesto & História", place: "A Fogueira", hint: "Quem sou e no que acredito" },
  { id: "skills", index: "02", title: "Inventário de Habilidades", place: "A Caixa de Ferramentas", hint: "O que carrego na trilha" },
  { id: "sky", index: "03", title: "Roadmap de Aprendizado", place: "O Telescópio", hint: "As constelações que sigo" },
  { id: "tent", index: "04", title: "Contato", place: "A Barraca & o Lampião", hint: "Vamos conversar" },
];

export const manifesto = {
  kicker: "Manifesto",
  title: "O código é a língua que escolhi para criar.",
  paragraphs: [
    "Toda fogueira começa com uma faísca pequena. A minha surgiu da curiosidade de entender o que havia por trás das telas que eu usava todos os dias: por que um botão reagia ao toque, como uma página sabia exatamente onde posicionar cada palavra. Ainda muito cedo, descobri que aquelas respostas não estavam escondidas — estavam escritas. E, se estavam escritas, eu poderia aprender a lê-las e, depois, a escrevê-las.",
    "Desde então, encaro a programação como uma linguagem no sentido mais pleno do termo. Assim como na língua portuguesa, há gramática, há coesão e há estilo. Um programa bem escrito não se limita a funcionar: ele comunica. Nomes precisos, estruturas claras e uma lógica que se deixa compreender são, para mim, a diferença entre um texto qualquer e um texto que merece ser lido.",
    "Na ETEC, no curso técnico de Informática para Internet, encontrei o terreno fértil para transformar curiosidade em método. Ali aprendi que disciplina não é o oposto da criatividade, mas o seu alicerce. Cada projeto entregue, cada erro investigado até a última linha e cada conceito revisitado consolidaram a convicção de que dominar os fundamentos é o caminho mais curto para construir algo verdadeiramente novo.",
    "Este acampamento é a prova disso. Não tenho, aos dezesseis anos, uma lista de clientes para apresentar — e não pretendo fingir que tenho. Ofereço, em vez disso, algo que considero mais honesto: este próprio site, construído do zero, como demonstração viva do que sei fazer e do cuidado com que faço. Cada árvore, cada brasa e cada estrela aqui foram pensadas, escritas e ajustadas por mim.",
  ],
  signature: "Pedro Henrique",
  facts: [
    { label: "Idade", value: "16 anos" },
    { label: "Formação", value: "Técnico em Informática para Internet — ETEC" },
    { label: "Foco", value: "Web moderna, interfaces interativas e lógica de sistemas" },
  ],
};

export type SkillCategory = "Linguagens" | "Front-end" | "Back-end" | "Ferramentas" | "Design";

export type Skill = {
  id: string;
  name: string;
  category: SkillCategory;
  level: number; // 0-100
  note: string;
};

export const skillCategories: SkillCategory[] = ["Linguagens", "Front-end", "Back-end", "Ferramentas", "Design"];

export const skills: Skill[] = [
  { id: "ts", name: "TypeScript", category: "Linguagens", level: 82, note: "Tipagem como documentação viva do sistema." },
  { id: "js", name: "JavaScript", category: "Linguagens", level: 88, note: "A base de tudo o que construo na web." },
  { id: "react", name: "React", category: "Front-end", level: 84, note: "Componentes, estado e interfaces reativas." },
  { id: "tailwind", name: "Tailwind CSS", category: "Front-end", level: 86, note: "Sistemas de design consistentes e rápidos." },
  { id: "htmlcss", name: "HTML & CSS", category: "Front-end", level: 92, note: "Semântica, acessibilidade e layout preciso." },
  { id: "node", name: "Node.js", category: "Back-end", level: 66, note: "APIs, scripts e o lado servidor da web." },
  { id: "arch", name: "Arquitetura Web", category: "Back-end", level: 62, note: "Separar responsabilidades para o código crescer." },
  { id: "git", name: "Git", category: "Ferramentas", level: 76, note: "Histórico limpo, branches e colaboração." },
  { id: "uiux", name: "UI/UX", category: "Design", level: 74, note: "Interfaces que se explicam sozinhas." },
  { id: "three", name: "Three.js / WebGL", category: "Front-end", level: 55, note: "Gráficos 3D em tempo real — como este cenário." },
];

export function levelLabel(level: number): string {
  if (level >= 85) return "Domínio";
  if (level >= 70) return "Avançado";
  if (level >= 55) return "Intermediário";
  return "Em formação";
}

export function filterSkills(list: Skill[], category: SkillCategory | "Todas"): Skill[] {
  const filtered = category === "Todas" ? list : list.filter((s) => s.category === category);
  return [...filtered].sort((a, b) => b.level - a.level);
}

export type Constellation = {
  id: "now" | "exploring" | "future";
  name: string;
  stage: string;
  description: string;
  stars: { label: string; detail: string }[];
};

export const roadmap: Constellation[] = [
  {
    id: "now",
    name: "O Artesão",
    stage: "O que domino hoje",
    description: "As estrelas já fixas no meu céu: ferramentas que uso com segurança no dia a dia.",
    stars: [
      { label: "HTML & CSS", detail: "Semântica e layout responsivo" },
      { label: "JavaScript", detail: "Lógica, DOM e assincronia" },
      { label: "TypeScript", detail: "Tipos e contratos claros" },
      { label: "React", detail: "Componentização e estado" },
      { label: "Tailwind", detail: "Design systems utilitários" },
      { label: "Git", detail: "Versionamento e colaboração" },
    ],
  },
  {
    id: "exploring",
    name: "O Explorador",
    stage: "O que estou explorando",
    description: "Pontos de luz que ainda estou mapeando — e que me tiram o sono no melhor sentido.",
    stars: [
      { label: "Inteligência Artificial", detail: "LLMs, APIs e produtos com IA" },
      { label: "WebGL & 3D", detail: "Three.js, shaders e cenas em tempo real" },
      { label: "Node.js & APIs", detail: "Back-end, bancos de dados e autenticação" },
      { label: "Acessibilidade", detail: "Web para todas as pessoas" },
    ],
  },
  {
    id: "future",
    name: "O Horizonte",
    stage: "Para onde vou",
    description: "As constelações distantes que orientam a trilha dos próximos anos.",
    stars: [
      { label: "Engenharia de Software", detail: "Arquitetura, testes e qualidade" },
      { label: "Algoritmos", detail: "Estruturas de dados e eficiência" },
      { label: "Graduação", detail: "Ciência da Computação ou Eng. de Software" },
      { label: "Open Source", detail: "Contribuir com a comunidade" },
      { label: "Primeiro estágio", detail: "Aprender com times reais" },
    ],
  },
];

export const contact = {
  email: "pedro.lamin10@gmail.com",
  github: "https://github.com/PedroLamin12",
  githubUser: "PedroLamin12",
  phone: "(11) 95050-3332",
  phoneHref: "tel:+5511950503332",
  whatsapp: "https://wa.me/5511950503332",
  status: "Disponível para estágios e projetos",
  statusDetail: "Aberto a oportunidades de estágio, projetos colaborativos e conversas sobre tecnologia.",
};

export const behindTheScenes = [
  { title: "React + TypeScript", text: "Toda a interface é tipada e dividida em módulos com responsabilidades claras." },
  { title: "Three.js com React Three Fiber", text: "A cena 3D é declarativa: cada elemento do acampamento é um componente." },
  { title: "Partículas na GPU", text: "Chamas e brasas são calculadas inteiramente em shaders, sem custo para o processador." },
  { title: "Aurora procedural", text: "O céu, as estrelas e a aurora são gerados por ruído matemático em tempo real." },
  { title: "Instanciamento", text: "Dezenas de pinheiros são desenhados em poucas chamadas à placa de vídeo." },
  { title: "Áudio sintetizado", text: "Fogueira, grilos e vento nascem da Web Audio API — nenhum arquivo de som é baixado." },
];
