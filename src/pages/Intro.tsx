import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingIntro } from "../components/LoadingIntro";
import "../styles/pageTransition.css";

export default function Intro() {
  const navigate = useNavigate();
  const DURATION = 2200;
  const FADE_OUT = 350;

  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => {
      setLeaving(true); 
    }, DURATION - FADE_OUT);

    const t2 = window.setTimeout(() => {
      navigate("/intro_after_load", { replace: true });
    }, DURATION);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [navigate]);

  return (
    <div className={leaving ? "page-fade-out" : ""}>
      <LoadingIntro durationMs={DURATION} steps={6} />
    </div>
  );
}