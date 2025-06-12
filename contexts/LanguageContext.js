'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import koTranslations from '@/lib/languages/ko.json';
import enTranslations from '@/lib/languages/en.json';

const translations = {
  ko: koTranslations,
  en: enTranslations,
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('ko');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 서버에서 언어 설정 가져오기
    const fetchLanguage = async () => {
      try {
        const response = await fetch('/api/auth/language');
        if (response.ok) {
          const data = await response.json();
          if (data.language) {
            setLanguage(data.language);
          }
        }
      } catch (error) {
        console.error('Failed to fetch language setting:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanguage();
  }, []);

  const changeLanguage = async (newLanguage) => {
    try {
      const response = await fetch('/api/auth/language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language: newLanguage }),
      });

      if (response.ok) {
        setLanguage(newLanguage);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to change language:', error);
      return false;
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  const value = {
    language,
    changeLanguage,
    t,
    isLoading,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>;
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
