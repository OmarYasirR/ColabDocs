import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debounces a value — returns the debounced version, updated only after
 * `delay` ms of no changes. Useful for search inputs, etc.
 */
export const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

/**
 * Returns a debounced version of a callback function. The identity of
 * the returned function is stable across renders; the latest `callback`
 * is always invoked via a ref so consumers don't need to memoize it.
 *
 * Primary use case: debouncing autosave calls from DocumentEditor.
 */
const useDebounce = (callback, delay = AUTOSAVE_DEFAULT_DELAY) => {
  const callbackRef = useRef(callback);
  const timerRef = useRef(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedFn = useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => () => cancel(), [cancel]);

  return [debouncedFn, cancel];
};

const AUTOSAVE_DEFAULT_DELAY = 800;

export default useDebounce;