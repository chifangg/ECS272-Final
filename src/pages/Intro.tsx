import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingIntro } from "../components/LoadingIntro";

export default function Intro() {
  const navigate = useNavigate();
  const DURATION = 2200;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/home", { replace: true });
    }, DURATION);

    return () => clearTimeout(timer);
  }, [navigate]);

  return <LoadingIntro durationMs={DURATION} steps={6} />;
}