import { useEffect, useState } from "react";

export function useBackendStatus() {
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000")
      .then((response) => response.json())
      .then((data: { message?: string }) => {
        setIsBackendConnected(Boolean(data.message));
      })
      .catch(() => setIsBackendConnected(false));
  }, []);

  return { isBackendConnected };
}
