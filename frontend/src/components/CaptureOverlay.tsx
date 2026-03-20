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
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="glass px-6 py-4 rounded-3xl shadow-2xl border-accent/50 border">
            <p className="text-3xl font-bold text-accent text-center">{text}</p>
            <p className="text-center text-lg text-white">+{points} ponto(s)</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
