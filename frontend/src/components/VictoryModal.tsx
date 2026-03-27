import { AnimatePresence, motion } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const VictoryModal = ({ open, onClose }: Props) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-slate-900 text-white shadow-[0_24px_80px_-24px_rgba(34,211,238,0.55)]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.22),transparent_42%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.18),transparent_38%)]" />
            <div className="absolute -right-14 top-6 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="relative p-7 sm:p-8">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">
                  {"Vitória"}
                </div>
                <img
                  src="/logo-create-joy-top-border.png"
                  alt="CreateJoy"
                  className="h-8 w-auto drop-shadow"
                />
              </div>

              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
                  {"Você capturou os 4 pokejoys!"}
                </h2>
              </div>

              <p className="mt-2 text-base leading-relaxed text-slate-200">
                {"Prêmio desbloqueado: Valor da matrícula GRÁTIS na CreateJoy!"}
              </p>

              <p className="mt-4 text-base text-cyan-100">
                {"Agende sua visita:"}
                <br />
                <a
                  href="https://wa.me/5537999113963"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent font-semibold underline underline-offset-4"
                >
                  https://wa.me/5537999113963
                </a>
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-7 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-base font-semibold text-slate-950 shadow-lg transition hover:brightness-105"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
