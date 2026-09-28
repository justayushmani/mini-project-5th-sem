import { useEffect, useState } from 'react';

/**
 * Debounces a value — useful for search inputs.
 * The value only updates after the user stops typing for `delay` ms.
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
