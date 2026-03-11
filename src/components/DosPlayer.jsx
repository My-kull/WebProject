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

function addJsDosCss() {
  let link = document.getElementById("js-dos-css");
  if (!link) {
    link = document.createElement("link");
    link.id = "js-dos-css";
    link.rel = "stylesheet";
    link.href = "/js-dos/js-dos.css";
    document.head.appendChild(link);
  }
  return link;
}

function removeJsDosCss() {
  const link = document.getElementById("js-dos-css");
  if (link) link.remove();
}

const DosPlayer = ({ bundleUrl }) => {
  const rootRef = useRef(null);
  const instanceRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!rootRef.current || !bundleUrl) return;
    let cancelled = false;

    loadJsDos()
      .then(() => {
        if (cancelled || !rootRef.current) return;
        addJsDosCss();
        const instance = window.Dos(rootRef.current, {
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
      removeJsDosCss();
    };
  }, [bundleUrl]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return <div ref={rootRef} style={{ width: "100%", height: "100%" }} />;
};

export default DosPlayer;
