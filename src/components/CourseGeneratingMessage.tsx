
import { useCourseLength } from "@/src/contexts/CourseLengthContext";
import { useLocalization } from "@/src/contexts/LocalizationContext";
import { useTheme } from "@/src/hooks/useTheme";
import { ResponsiveSizeWp } from "@/src/utility/responsive";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet } from "react-native";

const duration = 4000;

export default function CourseGeneratingMessage() {

    const theme = useTheme();
    const themedStyles = styles(theme);
    const { t } = useLocalization();
    const { courseLength } = useCourseLength();
    const animation = useRef(new Animated.Value(0)).current;
    const [messageIndex, setMessageIndex] = useState(0);
    const loadingMessages = t?.courseGenerationMessages[courseLength ?? 'short'];

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
        }, duration);

        return () => clearInterval(interval)
    }, [loadingMessages]);

    useEffect(()=>{
        const animationRef = Animated.sequence([
            Animated.timing(animation,{
                toValue: 1,
                duration: duration * 0.2,
                useNativeDriver: true,
            }),
            Animated.timing(animation,{
                toValue: 0,
                duration: duration * 0.2,
                delay: duration * 0.5,
                useNativeDriver: true,
            }),
        ])

        animationRef.start();

        return () => {
            animationRef.stop();
        };
    },[messageIndex])

    return (
        <Animated.Text style={[themedStyles.message,{
            opacity:animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1]
            })
        }]}>
            {loadingMessages[messageIndex]}
        </Animated.Text>
    );
}

const styles = (theme : any ) => StyleSheet.create({
 message: {
    fontSize: ResponsiveSizeWp(14),
    textAlign: "center",
    color: theme.nameTextColor,
    position:'absolute',
    transform:[{translateY: ResponsiveSizeWp(45)}],
    paddingHorizontal: ResponsiveSizeWp(40),
    lineHeight: ResponsiveSizeWp(20),
  },
});
