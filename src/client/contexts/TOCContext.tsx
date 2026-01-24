import { createContext, useContext, useState, ReactNode } from 'react';

interface TOCContextValue {
  hasTOC: boolean;
  setHasTOC: (has: boolean) => void;
}

const TOCContext = createContext<TOCContextValue | undefined>(undefined);

export function TOCProvider({ children }: { children: ReactNode }) {
  const [hasTOC, setHasTOC] = useState(false);

  return (
    <TOCContext.Provider value={{ hasTOC, setHasTOC }}>
      {children}
    </TOCContext.Provider>
  );
}

export function useTOC() {
  const context = useContext(TOCContext);
  if (!context) {
    throw new Error('useTOC must be used within TOCProvider');
  }
  return context;
}