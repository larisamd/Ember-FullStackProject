import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/StoreContext';

export default function Toaster() {
  const { state } = useStore();
  return (
    <div className="toast-wrap">
      <AnimatePresence>
        {state.toast && (
          <motion.div
            key={state.toast.id}
            className={`toast ${state.toast.kind}`}
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            {state.toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}