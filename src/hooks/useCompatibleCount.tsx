import { createContext, useContext, useState, ReactNode } from "react";

interface CompatibleCountContextType {
  count: number;
  setCount: (count: number) => void;
}

const CompatibleCountContext = createContext<CompatibleCountContextType>({
  count: 0,
  setCount: () => {},
});

export function CompatibleCountProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  return (
    <CompatibleCountContext.Provider value={{ count, setCount }}>
      {children}
    </CompatibleCountContext.Provider>
  );
}

export function useCompatibleCount() {
  return useContext(CompatibleCountContext);
}
