import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface DnDPayload {
  service: string;
  operation: string;
  label: string;
}

type DnDContextType = [DnDPayload | null, (payload: DnDPayload | null) => void];

const DnDContext = createContext<DnDContextType>([null, () => {}]);

export const DnDProvider = ({ children }: { children: ReactNode }) => {
  const [type, setType] = useState<DnDPayload | null>(null);

  return (
    <DnDContext.Provider value={[type, setType]}>
      {children}
    </DnDContext.Provider>
  );
}

export const useDnD = () => {
  return useContext(DnDContext);
}
