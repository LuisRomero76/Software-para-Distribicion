import { useEffect, useRef } from 'react';

interface TokenPayload {
  exp?: number;
  iat?: number;
}

function decodeJWT(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

export function useTokenExpiration(token: string | undefined, onExpire: () => void) {
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!token) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      return;
    }

    const payload = decodeJWT(token);
    if (!payload?.exp) return;

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = payload.exp - now;

    if (expiresIn <= 0) {
      onExpire();
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      onExpire();
    }, expiresIn * 1000);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [token, onExpire]);
}
