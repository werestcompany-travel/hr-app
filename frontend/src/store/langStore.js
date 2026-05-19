import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useLangStore = create(
  persist(
    (set) => ({
      lang: 'th',
      setLang: (lang) => set({ lang }),
    }),
    { name: 'hr-lang' }
  )
);
