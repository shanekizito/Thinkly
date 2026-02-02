import { createContext, ReactNode, useContext, useState } from 'react';

interface CourseLengthContextType {
    courseLength: string;
    setCourseLength: (length: string) => void;
}

// Create Context
const CourseLengthContext = createContext<CourseLengthContextType>({
    courseLength: '',
    setCourseLength: (length: string) => { }
});

// Provider Component
export const CourseLengthProvider = ({ children }: { children: ReactNode }) => {
    const [courseLength, setCourseLength] = useState<string>('short');

    return (
        <CourseLengthContext.Provider value={{ courseLength, setCourseLength }}>
            {children}
        </CourseLengthContext.Provider>
    );
};

// Custom hook for easy usage
export const useCourseLength = () => useContext(CourseLengthContext);
