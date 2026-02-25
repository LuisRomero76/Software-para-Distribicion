import { useEffect, useRef, useCallback } from 'react';

const INACTIVITY_LIMIT = 10 * 60 * 1000;
const WARNING_TIME = 9 * 60 * 1000;

/**
 * Detecta inactividad del usuario y dispara callbacks de aviso y cierre de sesión.
 * @param active  - true si hay sesión activa
 * @param onWarning - se llama al llegar al minuto 9 sin actividad
 * @param onLogout  - se llama al llegar al minuto 10 sin actividad
 */
export function useInactivityLogout(
  active: boolean,
  onWarning: () => void,
  onLogout: () => void,
) {
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs para evitar dependencias circulares en el callback
  const onLogoutRef = useRef(onLogout);
  const onWarningRef = useRef(onWarning);
  useEffect(() => { onLogoutRef.current = onLogout; }, [onLogout]);
  useEffect(() => { onWarningRef.current = onWarning; }, [onWarning]);

  const clearTimers = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
  }, []);

  const reset = useCallback(() => {
    clearTimers();

    warningTimerRef.current = setTimeout(() => {
      onWarningRef.current();
    }, WARNING_TIME);

    logoutTimerRef.current = setTimeout(() => {
      onLogoutRef.current();
    }, INACTIVITY_LIMIT);
  }, [clearTimers]);

  useEffect(() => {
    if (!active) {
      clearTimers();
      return;
    }

    const events: string[] = [
      'mousemove', 'mousedown', 'keydown',
      'scroll', 'touchstart', 'click',
    ];

    events.forEach(event =>
      window.addEventListener(event, reset, { passive: true }),
    );

    reset(); // Iniciar temporizador al montar

    return () => {
      events.forEach(event => window.removeEventListener(event, reset));
      clearTimers();
    };
  }, [active, reset, clearTimers]);
}
