// src/data/SearchContext.tsx
"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type SearchContextType = {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm, clearSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

