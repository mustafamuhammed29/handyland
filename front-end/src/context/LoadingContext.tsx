import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
    isLoading: boolean;
    startLoading: () => void;
    stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState(0);

    const startLoading = () => {
        setCount(prev => prev + 1);
        setIsLoading(true);
    };

    const stopLoading = () => {
        setCount(prev => {
            const newCount = Math.max(0, prev - 1);
            if (newCount === 0) setIsLoading(false);
            return newCount;
        });
    };

    return (
        <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};
