import { useCallback, useState } from 'react';

interface UseTaskTitleFormResult {
  title: string;
  error: string | null;
  setTitle: (value: string) => void;
  validate: () => boolean;
}

export function useTaskTitleForm(): UseTaskTitleFormResult {
  const [title, setTitleState] = useState('');
  const [error, setError] = useState<string | null>(null);

  const setTitle = useCallback((value: string) => {
    setTitleState(value);
    setError(null);
  }, []);

  const validate = useCallback(() => {
    if (title.trim().length === 0) {
      setError('Title is required');
      return false;
    }
    setError(null);
    return true;
  }, [title]);

  return { title, error, setTitle, validate };
}
