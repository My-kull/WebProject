import { useEffect, useRef, useState } from "react";

// Dos is loaded globally via index.html script tag
const DosPlayer = ({ bundleUrl }) => {
  const rootRef = useRef(null);
  const [dos, setDos] = useState(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const instance = window.Dos(rootRef.current);
    setDos(instance);

    return () => {
      instance.stop();
    };
  }, [rootRef]);

  useEffect(() => {
    if (dos && bundleUrl) {
      dos.run(bundleUrl);
    }
  }, [dos, bundleUrl]);

  return <div ref={rootRef} style={{ width: "100%", height: "100%" }} />;
};

export default DosPlayer;
