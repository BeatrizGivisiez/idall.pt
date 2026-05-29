import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { SUPER_ADMIN_EMAIL } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Login.css';

// ── Kanban mini (decorativo) ─────────────────────────────────────────────────

const NAMES = ['Marina S.', 'Carlos R.', 'Ana P.', 'João V.', 'Bia L.', 'Rafa M.',
  'Letícia', 'Diego F.', 'Camila', 'Téo N.'];
const DISHES: [string, string, number][] = [
  ['2× Burger HQ', 'Batata rústica', 56.0],
  ['Combo Família', 'Refri 2L', 89.9],
  ['Açaí 700ml', '+ 3 adicionais', 32.5],
  ['Marmita Fit', 'Frango grelhado', 27.0],
  ['Pizza G Calabresa', 'Borda catupiry', 64.0],
];
const STATUS_ORDER = ['novo', 'prep', 'saiu', 'fim'] as const;
type Status = (typeof STATUS_ORDER)[number];
const COL_LABELS: Record<Status, string> = { novo: 'Recebido', prep: 'Preparando', saiu: 'Saiu', fim: 'Finalizado' };

interface Order { id: number; who: string; items: string; total: number; t: number; }
type Board = Record<Status, Order[]>;

let seq = 2010;
function mkOrder(): Order {
  const d = DISHES[Math.floor(Math.random() * DISHES.length)];
  return { id: seq++, who: NAMES[Math.floor(Math.random() * NAMES.length)], items: `${d[0]} · ${d[1]}`, total: d[2], t: 0 };
}
function mkBoard(): Board {
  const b: Board = { novo: [], prep: [], saiu: [], fim: [] };
  [['novo', 0], ['prep', 3], ['prep', 7], ['saiu', 9], ['fim', 0]].forEach(([s, t]) => {
    const o = mkOrder(); o.t = t as number; b[s as Status].push(o);
  });
  return b;
}
function stepBoard(prev: Board): Board {
  const n: Board = { novo: [...prev.novo], prep: [...prev.prep], saiu: [...prev.saiu], fim: [...prev.fim] };
  while (n.fim.length > 2) n.fim.shift();
  if (n.saiu.length && Math.random() < 0.7) n.fim.push(n.saiu.shift()!);
  if (n.prep.length && Math.random() < 0.6) { const o = n.prep.shift()!; o.t = 0; n.saiu.push(o); }
  if (n.novo.length && Math.random() < 0.65) { const o = n.novo.shift()!; o.t = 0; n.prep.push(o); }
  if (n.novo.length < 2 && Math.random() < 0.8) n.novo.push(mkOrder());
  STATUS_ORDER.forEach((s) => n[s].forEach((o) => { if (s !== 'fim') o.t += Math.floor(Math.random() * 2) + 1; }));
  return n;
}
function fmtBRL(v: number) { return 'R$ ' + v.toFixed(2).replace('.', ','); }

function MiniKanban() {
  const [board, setBoard] = useState<Board>(mkBoard);
  useEffect(() => {
    const id = setInterval(() => setBoard(stepBoard), 2600);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="panel-card">
      <div className="panel-top">
        <div className="dots"><i /><i /><i /></div>
        <span className="ttl">Painel HQ</span>
        <span className="live"><span className="pulse" />AO VIVO</span>
      </div>
      <div className="kanban">
        {STATUS_ORDER.map((s) => (
          <div className="kcol" data-status={s} key={s}>
            <div className="kcol-head">
              <span className="name">{COL_LABELS[s]}</span>
              <span className="count">{board[s].length}</span>
            </div>
            <div className="kcards">
              {board[s].map((o) => (
                <div className="kcard" key={o.id}>
                  <div className="row1">
                    <span className="oid">#{o.id}</span>
                    <span className="time">{s === 'fim' ? '✓' : o.t === 0 ? 'agora' : `${o.t}m`}</span>
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

// ── SVGs senha ───────────────────────────────────────────────────────────────

const EyeOpen = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.4 5.2A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.1 6.1A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 3-.5" />
  </svg>
);

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

// ── Login component ──────────────────────────────────────────────────────────

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  // Auto-slug a partir do nome
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(restaurantName));
  }, [restaurantName, slugTouched]);

  function clearErr(field: string) {
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Informe um e-mail válido.';
    if (password.length < 6) errs.password = 'Mínimo de 6 caracteres.';
    if (!isLogin) {
      if (!restaurantName.trim()) errs.restaurantName = 'Informe o nome do negócio.';
      if (!slug.trim()) errs.slug = 'Escolha uma URL para o cardápio.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        setSuccessMsg('Entrando no seu Painel HQ…');
        setSuccess(true);
        setTimeout(() => navigate(cred.user.email === SUPER_ADMIN_EMAIL ? '/superadmin' : '/admin'), 1300);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'tenants', userCred.user.uid), {
          ownerId: userCred.user.uid,
          name: restaurantName || 'Meu Restaurante',
          slug: slug || email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-'),
          whatsapp: '',
          createdAt: Date.now(),
        });
        setSuccessMsg(`Seu cardápio em orderyhq.app/${slug || 'seu-negocio'} está pronto. Vamos configurar o painel.`);
        setSuccess(true);
        setTimeout(() => navigate('/admin/settings'), 1500);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setIsLogin((v) => !v);
    setErrors({});
  }

  return (
    <div className="auth-page">
      <div className="auth-wrap">

        {/* ── Painel de marca (esquerda) ──────────────────────────────── */}
        <aside className="auth-brand">
          <div className="auth-brand-head">
            <Link className="hl-logo" to="/">
              <span>Ordery</span><span className="hq">HQ</span>
            </Link>
            <Link className="auth-back" to="/">← Voltar ao site</Link>
          </div>

          <div className="auth-pitch">
            <h2>O seu <span className="hl">quartel-general</span> de pedidos.</h2>
            <p>
              Entre para comandar o cardápio, o fluxo e o status — tudo em
              tempo real, sem comissões.
            </p>
            <ul className="auth-bullets">
              <li>
                <span className="chk">✓</span>
                <span>Painel HQ ao vivo: Recebido → Preparando → Saiu → Finalizado.</span>
              </li>
              <li>
                <span className="chk">✓</span>
                <span>Cardápio whitelabel com a sua marca e a sua URL.</span>
              </li>
              <li>
                <span className="chk">✓</span>
                <span>Carrinho persistente integrado ao WhatsApp.</span>
              </li>
            </ul>
          </div>

          <div className="auth-panel-wrap">
            <MiniKanban />
          </div>
        </aside>

        {/* ── Formulário (direita) ─────────────────────────────────────── */}
        <main className="auth-form-col">
          <div className="auth-card">

            {!success ? (
              <div className="auth-form-inner">
                <div className="auth-card-top">
                  <Link className="hl-logo auth-logo" to="/">
                    <span>Ordery</span><span className="hq">HQ</span>
                  </Link>
                  <h1>{isLogin ? 'Entre na sua conta' : 'Crie sua conta'}</h1>
                  <p className="sub">Gerencie seu cardápio e pedidos em tempo real</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  {/* E-mail */}
                  <div className={`auth-field${errors.email ? ' has-error' : ''}`}>
                    <label htmlFor="f-email">E-mail</label>
                    <div className="input-wrap">
                      <input
                        id="f-email"
                        type="email"
                        autoComplete="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); clearErr('email'); }}
                      />
                    </div>
                    {errors.email && <div className="field-err">{errors.email}</div>}
                  </div>

                  {/* Nome do negócio — só cadastro */}
                  <div className={`auth-field signup-only${!isLogin ? ' open' : ''}`}>
                    <label htmlFor="f-name">Nome do negócio</label>
                    <div className="input-wrap">
                      <input
                        id="f-name"
                        type="text"
                        placeholder="Ex: Cozinha do Téo"
                        value={restaurantName}
                        onChange={(e) => { setRestaurantName(e.target.value); clearErr('restaurantName'); }}
                        tabIndex={!isLogin ? 0 : -1}
                      />
                    </div>
                    {errors.restaurantName && <div className="field-err">{errors.restaurantName}</div>}
                  </div>

                  {/* URL do cardápio — só cadastro */}
                  <div className={`auth-field signup-only${!isLogin ? ' open' : ''}`}>
                    <label htmlFor="f-url">
                      URL do cardápio <span className="hint">(exclusiva)</span>
                    </label>
                    <div className="input-wrap has-prefix">
                      <span className="input-prefix">orderyhq.app/</span>
                      <input
                        id="f-url"
                        type="text"
                        placeholder="seu-negocio"
                        autoCapitalize="off"
                        spellCheck={false}
                        value={slug}
                        onChange={(e) => {
                          setSlugTouched(true);
                          setSlug(slugify(e.target.value));
                          clearErr('slug');
                        }}
                        tabIndex={!isLogin ? 0 : -1}
                      />
                    </div>
                    {errors.slug && <div className="field-err">{errors.slug}</div>}
                  </div>

                  {/* Senha */}
                  <div className={`auth-field${errors.password ? ' has-error' : ''}`}>
                    <label htmlFor="f-pass">Senha</label>
                    <div className="input-wrap">
                      <input
                        id="f-pass"
                        type={showPw ? 'text' : 'password'}
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); clearErr('password'); }}
                      />
                      <button
                        type="button"
                        className="pw-toggle"
                        aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
                        onClick={() => setShowPw((v) => !v)}
                      >
                        {showPw ? <EyeOff /> : <EyeOpen />}
                      </button>
                    </div>
                    {errors.password && <div className="field-err">{errors.password}</div>}
                  </div>

                  {/* Manter conectado + esqueci senha (só login) */}
                  {isLogin && (
                    <div className="auth-meta">
                      <label className="remember">
                        <input type="checkbox" defaultChecked /> Manter conectado
                      </label>
                      <a href="#" onClick={(e) => e.preventDefault()}>Esqueci a senha</a>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={loading}
                  >
                    {loading ? <span className="spin" /> : (isLogin ? 'Entrar' : 'Cadastrar restaurante')}
                  </button>
                </form>

                <p className="auth-switch">
                  <span>{isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}</span>{' '}
                  <button type="button" onClick={switchMode}>
                    {isLogin ? 'Cadastre-se' : 'Entre'}
                  </button>
                </p>
              </div>
            ) : (
              <div className="auth-success">
                <div className="ok">✓</div>
                <h2>{isLogin ? 'Bem-vindo de volta!' : 'Conta criada!'}</h2>
                <p>{successMsg}</p>
                <span className="btn-go">Ir para o Painel HQ</span>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};
