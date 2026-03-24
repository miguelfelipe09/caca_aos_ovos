import { motion, AnimatePresence } from "framer-motion";

interface Props {
  show: boolean;
  text: string;
  points: number;
}

export const CaptureOverlay = ({ show, text, points }: Props) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
        >
          <motion.div
            initial={{ scale: 0.8, rotate: -6 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.8, rotate: 6 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
            className="relative overflow-hidden rounded-3xl px-8 py-6 shadow-2xl text-white bg-gradient-to-br from-emerald-400 via-fuchsia-500 to-blue-600 backdrop-blur"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.3),transparent_55%)] opacity-70" />
            <div className="absolute -left-10 -top-10 w-32 h-32 bg-white/20 blur-3xl rounded-full" />
            <div className="absolute -right-6 bottom-0 w-28 h-28 bg-black/20 blur-3xl rounded-full" />

            <div className="relative flex flex-col items-center gap-1 text-center">
              <span className="text-xs uppercase tracking-[0.4em] text-white/80">Conquista</span>
              <p className="text-4xl font-black drop-shadow-lg">{text}</p>
              <p className="text-lg font-semibold drop-shadow-sm">
                +{points} ponto{points === 1 ? "" : "s"}
              </p>
            </div>

            <div className="absolute inset-0 pointer-events-none">
              {[...Array(10)].map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: -10, scale: 0.7 }}
                  animate={{ opacity: 1, y: [0, -10, 6], scale: [1, 1.1, 1] }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.9, delay: i * 0.04, repeat: Infinity, repeatType: "loop" }}
                  className="absolute w-2 h-2 rounded-full bg-white/80"
                  style={{
                    left: `${10 + i * 8}%`,
                    top: `${20 + (i % 3) * 18}%`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
