import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingIntro } from "../components/LoadingIntro";

export default function Intro() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/home", { replace: true });
    }, 2200);

    return () => clearTimeout(timer);
  }, [navigate]);

  return <LoadingIntro />;
}