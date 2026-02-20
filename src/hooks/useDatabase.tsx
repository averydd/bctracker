import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getDatabase } from '../db/database';

interface DatabaseContextType {
  isReady: boolean;
  refreshKey: number;
  refresh: () => void;
}

const DatabaseContext = createContext<DatabaseContextType>({
  isReady: false,
  refreshKey: 0,
  refresh: () => {},
});

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getDatabase().then(() => setIsReady(true));
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return (
    <DatabaseContext.Provider value={{ isReady, refreshKey, refresh }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
