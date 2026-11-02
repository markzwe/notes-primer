import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
export function useLiveMessages(token: string, onUnauthorized: () => void) {
  const socket = useMemo(
    () => io({ auth: { token }, autoConnect: false }),
    [token],
  );
  const [status, setStatus] = useState("Connecting");
  useEffect(() => {
    function connected() {
      setStatus("Live");
    }
    function disconnected(reason: string) {
      setStatus("Offline — messages still send over HTTP");
      if (reason === "io server disconnect") onUnauthorized();
    }
    function failed(error: Error) {
      setStatus("Offline — reconnecting");
      if (error.message === "Authentication required.") onUnauthorized();
    }
    socket.on("connect", connected);
    socket.on("disconnect", disconnected);
    socket.on("connect_error", failed);
    socket.connect();
    return () => {
      socket.off("connect", connected);
      socket.off("disconnect", disconnected);
      socket.off("connect_error", failed);
      socket.disconnect();
    };
  }, [socket, onUnauthorized]);
  return { socket, status };
}
