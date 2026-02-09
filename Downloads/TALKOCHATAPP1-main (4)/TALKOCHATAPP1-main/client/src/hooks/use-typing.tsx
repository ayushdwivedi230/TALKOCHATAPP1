import { useRef, useEffect, useCallback } from "react";

type WS = WebSocket | null;

export function useTyping(ws: WS, getRecipientId: () => number | null | undefined) {
  const typingRef = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendTyping = useCallback(() => {
    const recipientId = getRecipientId();
    if (!ws || ws.readyState !== 1) return;

    // send typing start
    if (!typingRef.current) {
      try {
        ws.send(JSON.stringify({ type: "typing", recipientId: recipientId ?? null }));
        typingRef.current = true;
      } catch {}
    }

    // reset auto-stop timer
    if (stopTimer.current) clearTimeout(stopTimer.current as any);
    stopTimer.current = setTimeout(() => {
      if (ws && ws.readyState === 1) {
        try {
          ws.send(JSON.stringify({ type: "stop_typing", recipientId: recipientId ?? null }));
        } catch {}
      }
      typingRef.current = false;
      stopTimer.current = null;
    }, 3000);
  }, [ws, getRecipientId]);

  const stopTyping = useCallback(() => {
    const recipientId = getRecipientId();
    if (stopTimer.current) {
      clearTimeout(stopTimer.current);
      stopTimer.current = null;
    }
    if (typingRef.current && ws && ws.readyState === 1) {
      try {
        ws.send(JSON.stringify({ type: "stop_typing", recipientId: recipientId ?? null }));
      } catch {}
    }
    typingRef.current = false;
  }, [ws, getRecipientId]);

  useEffect(() => {
    return () => {
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
  }, []);

  return { sendTyping, stopTyping };
}
