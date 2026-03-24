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
              <div className="mb-5 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">
                {"Vit\u00f3ria"}
              </div>

              <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
                {"Voc\u00ea capturou todos os pokejoys do Tropical"}
              </h2>

              <p className="mt-4 text-base leading-relaxed text-slate-200">
                {"Sua jornada terminou em grande estilo. Com 8 pontos, voc\u00ea encontrou cada pokejoy espalhado pela ca\u00e7a e completou o desafio tropical."}
              </p>

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-300">{"Pontua\u00e7\u00e3o final"}</p>
                <p className="mt-2 text-5xl font-black text-cyan-300">8 pts</p>
              </div>

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
