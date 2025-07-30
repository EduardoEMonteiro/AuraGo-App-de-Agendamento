import { useCallback, useState } from 'react';

export function useSubmit<T extends (...args: any[]) => Promise<any>>(fn: T): [boolean, (...args: Parameters<T>) => Promise<void>] {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wrapped = useCallback(async (...args: Parameters<T>) => {
    setIsSubmitting(true);
    try {
      await fn(...args);
    } finally {
      setIsSubmitting(false);
    }
  }, [fn]);

  return [isSubmitting, wrapped];
} 