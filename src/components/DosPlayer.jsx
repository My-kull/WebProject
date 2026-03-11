import { useEffect, useRef, useState } from "react";

function loadJsDos() {
  return new Promise((resolve, reject) => {
    if (window.Dos) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "/js-dos/js-dos.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load js-dos"));
    document.head.appendChild(script);
  });
}

const DosPlayer = ({ bundleUrl }) => {
  const containerRef = useRef(null);
  const shadowRef = useRef(null);
  const instanceRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current || !bundleUrl) return;
    let cancelled = false;

    loadJsDos()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        // Create shadow DOM to isolate js-dos CSS from the rest of the page
        if (!shadowRef.current) {
          shadowRef.current = containerRef.current.attachShadow({ mode: "open" });

          const style = document.createElement("link");
          style.rel = "stylesheet";
          style.href = "/js-dos/js-dos.css";
          shadowRef.current.appendChild(style);
        }

        const dosRoot = document.createElement("div");
        dosRoot.style.width = "100%";
        dosRoot.style.height = "100%";
        shadowRef.current.appendChild(dosRoot);

        const instance = window.Dos(dosRoot, {
          url: bundleUrl,
          pathPrefix: "/js-dos/emulators/",
        });
        instanceRef.current = instance;
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
      if (instanceRef.current) {
        instanceRef.current.stop();
        instanceRef.current = null;
      }
    };
  }, [bundleUrl]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
};

export default DosPlayer;
