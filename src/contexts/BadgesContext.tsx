import { createContext, ReactNode, useContext, useState } from 'react';

interface BadgesContextType {
    earnedBadge: string;
    setEarnedBadge: (badge: string) => void;
}

// Create Context
const BadgesContext = createContext<BadgesContextType>({
    earnedBadge: '',
    setEarnedBadge: (badge: string) => { }
});

// Provider Component
export const BadgesProvider = ({ children }: { children: ReactNode }) => {
    const [earnedBadge, setEarnedBadge] = useState<string>('');

    return (
        <BadgesContext.Provider value={{ earnedBadge, setEarnedBadge }}>
            {children}
        </BadgesContext.Provider>
    );
};

// Custom hook for easy usage
export const useBadgeEarn = () => useContext(BadgesContext);
