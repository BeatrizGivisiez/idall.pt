import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const WA_NUMBER = "5524998380056";
function waLink(msg: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// ── Kanban ──────────────────────────────────────────────────────────────────

const NAMES = [
  "Marina S.", "Carlos R.", "Ana P.", "João V.", "Bia L.", "Rafa M.",
  "Letícia", "Diego F.", "Camila", "Téo N.", "Paula", "Vitor",
];
const DISHES: [string, string, number][] = [
  ["2× Burger HQ", "Batata rústica", 56.0],
  ["Combo Família", "Refri 2L", 89.9],
  ["Açaí 700ml", "+ 3 adicionais", 32.5],
  ["Marmita Fit", "Frango grelhado", 27.0],
  ["Pizza G Calabresa", "Borda catupiry", 64.0],
  ["3× Coxinha", "Molho extra", 21.0],
  ["Salada Caesar", "Frango crispy", 34.5],
  ["Esfiha 6un", "Carne + queijo", 29.9],
  ["Poke Salmão", "Edamame", 48.0],
  ["Bowl Vegano", "Grão-de-bico", 38.0],
];

const STATUS_ORDER = ["novo", "prep", "saiu", "fim"] as const;
type Status = (typeof STATUS_ORDER)[number];

const COLUMN_LABELS: Record<Status, string> = {
  novo: "Recebido",
  prep: "Preparando",
  saiu: "Saiu",
  fim: "Finalizado",
};

interface Order {
  id: number;
  who: string;
  items: string;
  total: number;
  t: number;
}
type Board = Record<Status, Order[]>;

let orderSeq = 1042;
function makeOrder(): Order {
  const d = DISHES[Math.floor(Math.random() * DISHES.length)];
  return {
    id: orderSeq++,
    who: NAMES[Math.floor(Math.random() * NAMES.length)],
    items: `${d[0]} · ${d[1]}`,
    total: d[2],
    t: 0,
  };
}

function makeInitialBoard(): Board {
  const board: Board = { novo: [], prep: [], saiu: [], fim: [] };
  const seed: [Status, number][] = [
    ["novo", 0], ["novo", 1],
    ["prep", 3], ["prep", 6],
    ["saiu", 9],
    ["fim", 0],
  ];
  seed.forEach(([s, t]) => {
    const o = makeOrder();
    o.t = t;
    board[s].push(o);
  });
  return board;
}

function stepBoard(prev: Board): Board {
  const next: Board = {
    novo: [...prev.novo],
    prep: [...prev.prep],
    saiu: [...prev.saiu],
    fim: [...prev.fim],
  };
  while (next.fim.length > 2) next.fim.shift();
  if (next.saiu.length && Math.random() < 0.7) next.fim.push(next.saiu.shift()!);
  if (next.prep.length && Math.random() < 0.6) {
    const o = next.prep.shift()!;
    o.t = 0;
    next.saiu.push(o);
  }
  if (next.novo.length && Math.random() < 0.65) {
    const o = next.novo.shift()!;
    o.t = 0;
    next.prep.push(o);
  }
  if (next.novo.length < 3 && Math.random() < 0.8) next.novo.push(makeOrder());
  STATUS_ORDER.forEach((s) =>
    next[s].forEach((o) => {
      if (s !== "fim") o.t += Math.floor(Math.random() * 2) + 1;
    })
  );
  return next;
}

function fmtBRL(v: number) {
  return "R$ " + v.toFixed(2).replace(".", ",");
}

function KanbanBoard({ title }: { title: string }) {
  const [board, setBoard] = useState<Board>(makeInitialBoard);

  useEffect(() => {
    const id = setInterval(() => setBoard(stepBoard), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div className="panel-top">
        <div className="dots">
          <i /><i /><i />
        </div>
        <span className="ttl">{title}</span>
        <span className="live">
          <span className="pulse" />
          AO VIVO
        </span>
      </div>
      <div className="kanban">
        {STATUS_ORDER.map((s) => (
          <div className="kcol" data-status={s} key={s}>
            <div className="kcol-head">
              <span className="name">{COLUMN_LABELS[s]}</span>
              <span className="count">{board[s].length}</span>
            </div>
            <div className="kcards">
              {board[s].map((o) => (
                <div className="kcard" key={o.id}>
                  <div className="row1">
                    <span className="oid">#{o.id}</span>
                    <span className="time">
                      {s === "fim" ? "✓ entregue" : o.t === 0 ? "agora" : `${o.t} min`}
                    </span>
                  </div>
                  <div className="who">{o.who}</div>
                  <div className="items">{o.items}</div>
                  <div className="total">{fmtBRL(o.total)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Home ────────────────────────────────────────────────────────────────────

export const Home: React.FC = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [navScrolled, setNavScrolled] = useState(false);

  // Nav scroll
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const els = wrap.querySelectorAll<HTMLElement>(".reveal");

    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    els.forEach((e) => io.observe(e));

    const revealInView = () => {
      const vh = window.innerHeight;
      els.forEach((e) => {
        if (e.classList.contains("in")) return;
        const r = e.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) {
          e.classList.add("in");
          io.unobserve(e);
        }
      });
    };
    requestAnimationFrame(revealInView);
    const t = setTimeout(revealInView, 200);

    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="home-landing" ref={wrapRef}>
      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <header className={`hl-nav${navScrolled ? " scrolled" : ""}`}>
        <div className="hl-container hl-nav-inner">
          <span className="hl-logo">
            <span>Ordery</span><span className="hq">HQ</span>
          </span>

          <nav className="hl-nav-links">
            <a href="#problema">Por quê</a>
            <a href="#pilares">Funcionalidades</a>
            <a href="#como">Como funciona</a>
            <a href="#precos">Preços</a>
          </nav>

          <div className="hl-nav-right">
            <Link className="btn btn-ghost btn-sm" to="/admin/login">
              Entrar
            </Link>
            <Link className="btn btn-primary btn-sm" to="/admin/login?mode=register">
              Criar conta grátis
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="hero">
          <div className="hl-container hero-grid">
            <div className="hero-copy reveal">
              <span className="eyebrow">
                <span className="dot" />
                Software de pedidos · Sem comissão
              </span>
              <h1>
                Transforme o caos do WhatsApp na sua{" "}
                <span className="hl">Central de Comando</span>.
              </h1>
              <p className="hero-sub">
                Crie um cardápio digital próprio, receba pedidos organizados em
                tempo real e atualize o cliente automaticamente. Sem taxa por
                pedido. No ar em 5 minutos.
              </p>
              <div className="hero-cta">
                <Link
                  className="btn btn-primary btn-lg"
                  to="/admin/login?mode=register"
                >
                  Assumir o controle do menu
                </Link>
                <a className="btn btn-ghost btn-lg" href="#painel">
                  Ver o painel ao vivo ↓
                </a>
              </div>
              <div className="hero-trust">
                <span><i className="chk">✓</i> R$ 10 por mês</span>
                <span><i className="chk">✓</i> Zero comissão por pedido</span>
                <span><i className="chk">✓</i> Cancele quando quiser</span>
              </div>
            </div>

            <div className="hero-visual reveal">
              <div className="visual-stage">
                <div className="panel-card">
                  <KanbanBoard title="Painel HQ — Cozinha do Téo" />
                </div>
                <div className="phone-card">
                  <div className="phone-notch" />
                  <div className="phone-brand">
                    <span className="avatar">T</span>
                    <div>
                      <b>Cozinha do Téo</b>
                      <small>Aberto · entrega ~30 min</small>
                    </div>
                  </div>
                  <div className="phone-menu">
                    <div className="menu-item">
                      <span className="thumb" />
                      <div>
                        <div className="mi-name">Burger HQ</div>
                        <div className="mi-desc">180g · cheddar</div>
                      </div>
                      <span className="mi-price">R$ 28</span>
                    </div>
                    <div className="menu-item">
                      <span className="thumb" />
                      <div>
                        <div className="mi-name">Combo Família</div>
                        <div className="mi-desc">4 burgers + fritas</div>
                      </div>
                      <span className="mi-price">R$ 89</span>
                    </div>
                    <div className="menu-item">
                      <span className="thumb" />
                      <div>
                        <div className="mi-name">Batata rústica</div>
                        <div className="mi-desc">com alecrim</div>
                      </div>
                      <span className="mi-price">R$ 18</span>
                    </div>
                  </div>
                  <div className="phone-cart">
                    <span>Finalizar pedido</span>
                    <span className="badge">3 itens</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Antes e depois ────────────────────────────────────────── */}
        <section className="section-pad" id="problema">
          <div className="hl-container">
            <div className="section-head reveal">
              <span className="kicker">Antes e depois</span>
              <h2>Você não precisa de mais um app. Precisa do comando.</h2>
              <p>
                Gerir pedidos com mensagens soltas é caro e confuso. Veja o que
                muda quando o fluxo passa a ser seu.
              </p>
            </div>

            <div className="compare reveal">
              <div className="compare-card pain">
                <h3><span className="tag">O caos de hoje</span></h3>
                <ul className="compare-list">
                  <li><span className="ic">✕</span><span>Cliente pede o cardápio em PDF e some no meio da conversa.</span></li>
                  <li><span className="ic">✕</span><span>Mensagens perdidas no WhatsApp — pedido trocado ou esquecido.</span></li>
                  <li><span className="ic">✕</span><span>A cozinha não sabe o que já foi preparado.</span></li>
                  <li><span className="ic">✕</span><span>Taxas abusivas do marketplace comendo a sua margem.</span></li>
                </ul>
              </div>

              <div className="vs">vs</div>

              <div className="compare-card gain">
                <h3><span className="tag">O efeito OrderyHQ</span></h3>
                <ul className="compare-list">
                  <li><span className="ic">✓</span><span>Cliente abre o QR Code ou o link da bio e vê o cardápio sempre atualizado.</span></li>
                  <li><span className="ic">✓</span><span>Monta o pedido num carrinho que <strong>não some</strong> se fechar o navegador.</span></li>
                  <li><span className="ic">✓</span><span>Você muda o status com um clique: Recebido → Preparando → Saiu.</span></li>
                  <li><span className="ic">✓</span><span>Zero comissão. O lucro do pedido é inteiramente seu.</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pilares ───────────────────────────────────────────────── */}
        <section className="section-pad" id="pilares">
          <div className="hl-container">
            <div className="section-head reveal">
              <span className="kicker">Os pilares do QG</span>
              <h2>Tudo o que o seu negócio precisa para vender comida sozinho.</h2>
              <p>
                Sem termos técnicos. Só ferramentas que trabalham para você desde
                o primeiro pedido.
              </p>
            </div>

            <div className="features-grid">
              <div className="feature reveal">
                <span className="fnum">01</span>
                <div className="ficon">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M3 9h18M9 9v11M15 9v11" />
                  </svg>
                </div>
                <h3>Painel HQ em tempo real</h3>
                <p>
                  Cada pedido entra numa coluna e avança com um clique. A cozinha
                  vê exatamente o que preparar agora — e o cliente é avisado
                  automaticamente.
                </p>
              </div>

              <div className="feature reveal">
                <span className="fnum">02</span>
                <div className="ficon">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l8 4v6c0 4-3 6.5-8 8-5-1.5-8-4-8-8V7z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <h3>A sua marca, as suas regras</h3>
                <p>
                  Whitelabel de verdade: o menu herda as cores do seu negócio.
                  Nada de logo de concorrente nem anúncio de marketplace no
                  rodapé.
                </p>
              </div>

              <div className="feature reveal">
                <span className="fnum">03</span>
                <div className="ficon">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z" />
                  </svg>
                </div>
                <h3>Carrinho que vira WhatsApp</h3>
                <p>
                  Carrinho persistente que não perde o pedido. Quando precisa,
                  o OrderyHQ gera a mensagem mastigada e pronta para o WhatsApp
                  da entrega.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Painel ao vivo ────────────────────────────────────────── */}
        <section className="section-pad" id="painel" style={{ paddingTop: 0 }}>
          <div className="hl-container">
            <div className="section-head center reveal">
              <span className="kicker">Veja funcionando</span>
              <h2>O seu quartel-general de pedidos.</h2>
              <p>
                Recebido, Preparando, Saiu, Finalizado. Tudo num só lugar,
                atualizando em tempo real.
              </p>
            </div>

            <div className="showcase reveal">
              <KanbanBoard title="Painel HQ — fluxo de pedidos" />
            </div>
          </div>
        </section>

        {/* ── Como funciona ─────────────────────────────────────────── */}
        <section className="section-pad" id="como">
          <div className="hl-container">
            <div className="section-head center reveal">
              <span className="kicker">Como funciona</span>
              <h2>Do clique do cliente à cozinha — em 3 passos.</h2>
            </div>

            <div className="steps reveal">
              <div className="step">
                <div className="snum">1</div>
                <h3>O cliente abre o menu</h3>
                <p>
                  Pelo QR Code na mesa ou pelo link da bio. Cardápio limpo, com a
                  sua marca, sempre atualizado.
                </p>
                <div className="arrow">→</div>
              </div>
              <div className="step">
                <div className="snum">2</div>
                <h3>Monta o pedido no carrinho</h3>
                <p>
                  Escolhe os produtos num carrinho persistente. Combos e promoções
                  aparecem em destaque.
                </p>
                <div className="arrow">→</div>
              </div>
              <div className="step">
                <div className="snum">3</div>
                <h3>Você comanda o status</h3>
                <p>
                  O pedido cai no Painel HQ. Você avança o status com um clique e
                  o cliente é avisado na hora.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Preços ────────────────────────────────────────────────── */}
        <section className="section-pad" id="precos">
          <div className="hl-container">
            <div className="section-head center reveal">
              <span className="kicker">Preço sem pegadinha</span>
              <h2>Menos que uma taxa de entrega. Por mês inteiro.</h2>
              <p>
                Um sistema completo custa menos do que você paga de comissão num
                único pedido do marketplace.
              </p>
            </div>

            <div className="pricing-grid reveal">
              <div className="price-card">
                <span className="plan">Mensal</span>
                <div className="amount">
                  <span className="cur">R$</span>
                  <span className="val">10</span>
                  <span className="per">/ mês</span>
                </div>
                <p className="sub">
                  Ideal para testar a operação e ver o fluxo acontecer.
                </p>
                <ul className="price-feats">
                  <li><span className="chk">✓</span><span>Cardápio digital com a sua marca</span></li>
                  <li><span className="chk">✓</span><span>Painel HQ em tempo real</span></li>
                  <li><span className="chk">✓</span><span>Carrinho persistente + WhatsApp</span></li>
                  <li><span className="chk">✓</span><span>Cancele quando quiser</span></li>
                </ul>
                <a
                  className="btn btn-ghost btn-lg"
                  style={{ width: "100%" }}
                  href={waLink("Quero ativar o plano mensal de R$ 10 do OrderyHQ.")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ativar plano mensal
                </a>
              </div>

              <div className="price-card featured">
                <span className="price-badge">Economize 17% · 2 meses grátis</span>
                <span className="plan">Anual</span>
                <div className="amount">
                  <span className="cur">R$</span>
                  <span className="val">100</span>
                  <span className="per">/ ano</span>
                </div>
                <p className="sub">
                  Para quem já entendeu que a Central de Comando é indispensável.
                </p>
                <ul className="price-feats">
                  <li><span className="chk">✓</span><span>Tudo do plano mensal</span></li>
                  <li><span className="chk">✓</span><span>2 meses grátis no ano</span></li>
                  <li><span className="chk">✓</span><span>Prioridade no suporte</span></li>
                  <li><span className="chk">✓</span><span>Customização Whitelabel completa</span></li>
                </ul>
                <a
                  className="btn btn-primary btn-lg"
                  style={{ width: "100%" }}
                  href={waLink("Quero aproveitar o desconto e ativar o plano anual de R$ 100 do OrderyHQ.")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ativar minha Central de Comando
                </a>
                <p className="equiv">≈ menos de R$ 8,40 por mês</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA final ─────────────────────────────────────────────── */}
        <section className="section-pad" style={{ paddingTop: 0 }}>
          <div className="hl-container">
            <div className="final-cta reveal">
              <span className="eyebrow">
                <span className="dot" />
                5 minutos para começar
              </span>
              <h2>Assuma o comando dos seus pedidos.</h2>
              <p>
                Fale com a gente agora pelo WhatsApp. A gente configura junto e
                você já vê o fluxo acontecendo hoje.
              </p>
              <Link
                className="btn btn-primary btn-lg"
                to="/admin/login?mode=register"
              >
                Criar meu cardápio agora
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer>
        <div className="hl-container">
          <div className="footer-inner">
            <div>
              <span className="hl-logo">
                <span>Ordery</span><span className="hq">HQ</span>
              </span>
              <p className="tagline">
                A central de comando para quem vende comida. Sem comissões, sem caos.
              </p>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <h5>Produto</h5>
                <a href="#pilares">Funcionalidades</a>
                <a href="#painel">Painel HQ</a>
                <a href="#precos">Preços</a>
              </div>
              <div className="footer-col">
                <h5>Falar com a gente</h5>
                <a
                  href={waLink("Olá! Quero falar sobre o OrderyHQ.")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp · Brasil
                </a>
                <a
                  href="https://wa.me/351915642507"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp · Portugal
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} OrderyHQ. Feito para quem vende comida.</span>
            <span>Whitelabel · Sem comissão por pedido</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
