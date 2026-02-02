import { createContext, ReactNode, useContext, useState } from 'react';

type TopicContextType = {
    topic: string | null;
    setTopic: (t: string | null) => void;
};

const TopicContext = createContext < TopicContextType | undefined > (undefined);

export function TopicProvider({ children }: { children: ReactNode }) {
    const [topic, setTopic] = useState < string | null > (null);

    return (
        <TopicContext.Provider value={{ topic, setTopic }}>
            {children}
        </TopicContext.Provider>
    );
}

export function useTopic() {
    const ctx = useContext(TopicContext);
    if (!ctx) throw new Error("useTopic must be used inside TopicProvider");
    return ctx;
}
