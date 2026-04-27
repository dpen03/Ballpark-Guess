import { motion, AnimatePresence } from "framer-motion";

const SPARKS = Array.from({ length: 14 });

/**
 * Big celebratory burst rendered behind the locked pick card.
 * Trigger by mounting the component (rendered via AnimatePresence with key).
 */
export function LockBurst() {
  return (
    <AnimatePresence>
      <motion.div
        key="burst"
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible z-10"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Solid expanding ring */}
        <motion.div
          className="absolute h-20 w-20 rounded-full bg-primary/40"
          initial={{ scale: 0, opacity: 0.95 }}
          animate={{ scale: 5.5, opacity: 0 }}
          transition={{ duration: 0.85, ease: "easeOut" }}
        />
        {/* Inner brighter pop */}
        <motion.div
          className="absolute h-12 w-12 rounded-full bg-primary"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2.4, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        {SPARKS.map((_, i) => {
          const angle = (i / SPARKS.length) * Math.PI * 2;
          const dist = 100;
          return (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-primary"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1.4 }}
              animate={{
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                opacity: 0,
                scale: 0.4,
              }}
              transition={{ duration: 0.75, ease: "easeOut" }}
            />
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
