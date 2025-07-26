import { atom, useAtom } from 'jotai';

const userAtom = atom<any>(null);

export function useJotaiAuth() {
  const [user, setUser] = useAtom(userAtom);
  const logout = () => setUser(null);
  return { user, setUser, logout };
} 