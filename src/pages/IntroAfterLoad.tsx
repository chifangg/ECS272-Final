import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContinueOverlay } from "../components/ContinueOverlay.tsx";
import "../styles/pageTransition.css";

export default function IntroAfterLoad() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setOpen(true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="page-fade-in">
      <ContinueOverlay
        open={open}
        title="Where is my next destination?"
        buttonText="continue my journey"
        onContinue={() => {
          localStorage.removeItem("gallery-toured");
          localStorage.removeItem("home-toured");
          localStorage.removeItem("explore-toured");
          navigate("/starter", { replace: true });
        }}
      />
    </div>
  );
}