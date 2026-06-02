import React, { useState } from "react";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { Store, Eye, EyeOff } from "lucide-react";
import firebaseConfig from "../../../firebase-applet-config.json";

const SECONDARY = "sa-create";
const secondaryApp =
  getApps().find((a) => a.name === SECONDARY) || initializeApp(firebaseConfig, SECONDARY);
const secondaryAuth = getAuth(secondaryApp);
const secondaryDb = getFirestore(secondaryApp);

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const CreateRestaurant: React.FC = () => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleNameChange(val: string) {
    setName(val);
    setSlug(toSlug(val));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nome obrigatório.";
    if (!slug.trim() || !/^[a-z0-9-]+$/.test(slug)) errs.slug = "Slug inválido (apenas letras, números e hífens).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "E-mail inválido.";
    if (password.length < 6) errs.password = "Mínimo 6 caracteres.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      await setDoc(doc(secondaryDb, "tenants", cred.user.uid), {
        ownerId: cred.user.uid,
        name: name.trim(),
        slug: slug.trim(),
        whatsapp: whatsapp.trim(),
        themeColor: "#22c55e",
        createdAt: Date.now(),
      });
      await signOut(secondaryAuth);
      toast.success(`Restaurante "${name}" criado com sucesso!`);
      setName(""); setSlug(""); setWhatsapp(""); setEmail(""); setPassword("");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setErrors((p) => ({ ...p, email: "Este e-mail já está em uso." }));
      } else {
        toast.error(err.message || "Erro ao criar restaurante.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Novo Restaurante</h2>
        <p className="text-sm text-slate-500 mt-1">
          Cria a conta e o perfil do restaurante de uma vez.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome do restaurante</label>
          <input
            type="text"
            placeholder="Ex: Burger do João"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Slug (URL do cardápio)
          </label>
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-orange-400 focus-within:bg-white">
            <span className="px-3 py-2.5 text-sm text-slate-400 border-r border-slate-200 shrink-0 bg-slate-100">
              /r/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="flex-1 px-3 py-2.5 text-sm text-slate-900 bg-transparent focus:outline-none"
            />
          </div>
          {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">WhatsApp</label>
          <input
            type="tel"
            placeholder="5511999999999"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white"
          />
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credenciais de acesso</p>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-mail</label>
            <input
              type="email"
              placeholder="dono@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => { const n = { ...p }; delete n.email; return n; }); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Senha</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors disabled:opacity-60"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Store className="h-4 w-4" /> Criar Restaurante
            </>
          )}
        </button>
      </form>
    </div>
  );
};
