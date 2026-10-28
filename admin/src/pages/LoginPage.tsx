import { motion } from "framer-motion";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage, useAuth } from "@/context/AuthContext";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

function AnimatedStat({ label, value }: { label: string; value: number }) {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const duration = 900;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);

  return (
    <div>
      <p className="text-3xl font-extrabold text-white sm:text-4xl">
        {display.toLocaleString("fr-FR")}
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
        {label}
      </p>
    </div>
  );
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const [identifier, setIdentifier] = useState("admin@ireduc.cd");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  if (isAuthenticated) return <Navigate to="/" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Connexion impossible"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-full lg:grid-cols-2">
      <motion.aside
        initial={reduced ? false : { opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative hidden overflow-hidden bg-brand-gradient p-10 text-white lg:flex lg:flex-col lg:justify-between"
      >
        <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-10 h-56 w-56 rounded-full bg-ireduc-primary/40 blur-3xl" />

        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-extrabold backdrop-blur">
              IR
            </span>
            <div>
              <p className="text-sm font-extrabold tracking-[0.2em]">IREDUC</p>
              <p className="text-xs text-white/70">Administration</p>
            </div>
          </div>
          <h1 className="mt-16 max-w-md text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
            Trouvez.
            <br />
            Comparez.
            <br />
            Réalisez.
          </h1>
          <p className="mt-4 max-w-sm text-sm font-medium text-white/80">
            Pilotez la plateforme immobilière et habitat de Kinshasa depuis un
            espace moderne, clair et sécurisé.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 border-t border-white/20 pt-8">
          <AnimatedStat label="Utilisateurs" value={1280} />
          <AnimatedStat label="Partenaires" value={186} />
          <AnimatedStat label="Villes" value={1} />
        </div>
      </motion.aside>

      <div className="flex items-center justify-center bg-[var(--bg-app)] p-6 sm:p-10">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-sm font-extrabold text-white">
              IR
            </span>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-ireduc-primary">
              IREDUC
            </p>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Connexion
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Accès réservé aux administrateurs. Identifiez-vous avec votre numéro
            ou votre e-mail.
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            {error ? <Alert tone="error">{error}</Alert> : null}
            <div className="space-y-1.5">
              <label
                className="text-sm font-bold text-[var(--text-primary)]"
                htmlFor="identifier"
              >
                Téléphone ou e-mail
              </label>
              <Input
                id="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="+243810000002 ou admin@ireduc.cd"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-sm font-bold text-[var(--text-primary)]"
                htmlFor="password"
              >
                Mot de passe
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-12"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
            <p className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
              <ShieldCheck size={14} className="text-ireduc-success" />
              Connexion sécurisée · sessions protégées
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
