import { motion } from "framer-motion";

type Props = {
  onDone: () => void;
};

export function LoadingIntro({ onDone }: Props) {

  const totalMs = 2400;

  return (
    <div className="stage">
      <div className="stage-inner">
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: totalMs / 1000 }}
          onAnimationComplete={onDone}
          style={{ width: "100%", height: "100%", position: "relative" }}
        >

          <motion.div
            style={{
              position: "absolute",
              left: "18%",
              top: "45%",
              fontSize: 26,
              color: "white",
              filter: "drop-shadow(0 1px 0 rgba(0,0,0,.35))"
            }}
            initial={{ x: 0 }}
            animate={{ x: 560 }}
            transition={{ duration: totalMs / 1000, ease: "linear" }}
          >
            ✈︎
          </motion.div>


          <div style={{ position: "absolute", left: "28%", top: "46%", color: "white" }}>
            {[0,1,2,3,4,5].map((i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.35, duration: 0.1 }}
                style={{ marginRight: 10, fontSize: 14 }}
              >
                ○
              </motion.span>
            ))}
          </div>


          <motion.div
            style={{
              position: "absolute",
              left: "50%",
              top: "45%",
              fontSize: 26,
              color: "white",
              opacity: 0.95
            }}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 120 }}
            transition={{ delay: 0.9, duration: 1.5, ease: "easeOut" }}
          >
            ✈︎
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}