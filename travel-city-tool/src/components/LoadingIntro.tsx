import { motion } from "framer-motion";

export function LoadingIntro() {
  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: "#6c778f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden"
    }}>
      <motion.div
        initial={{ x: -600 }}
        animate={{ x: window.innerWidth + 200 }}
        transition={{ duration: 5.6, ease: "linear" }}
        style={{
          fontSize: 80,
          color: "white"
        }}
      >
        ✈︎
      </motion.div>
    </div>
  );
}