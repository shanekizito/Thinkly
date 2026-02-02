import { useAuth } from '@/src/contexts/AuthContext';
import { useLocalization } from '@/src/contexts/LocalizationContext';
import { useTheme } from '@/src/hooks/useTheme';
import { ResponsiveSizeWp } from '@/src/utility/responsive';
import { db } from '@services/firebaseConfig';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const calculateLevel = (xp: number) => {
    return Math.floor(xp / 600) + 1;
};

const LevelUpModal = () => {

    const { t } = useLocalization();
    const theme = useTheme();
    const themedStyles = styles(theme);
    const { user, } = useAuth();
    const [level, setLevel] = useState<Number>();
    const [visible, setVisibility] = useState<Boolean>(false);

    useEffect(() => {
        if (!user) return;

        const userRef = db.collection('users').doc(user.uid);
        const unsubscribeUser = userRef.onSnapshot(async (doc) => {
            const data = doc.data();
            const xp = data?.xp;
            if (typeof xp === 'number') {
                const level = data?.level ?? 0;
                const newLevel = calculateLevel(xp);
                if (newLevel > level) {
                    try {
                        setLevel(newLevel);
                        setVisibility(true);
                        await userRef.update({ level: newLevel });
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
        });

        return () => {
            unsubscribeUser();
        };
    }, [user?.uid]);


    const onDismiss = () => { setVisibility(false) }

    return (
        visible ?
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.4)',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'absolute',
                zIndex: 1000000,
                height: '100%',
                width: '100%',
            }}>
                <View style={{
                    backgroundColor: theme.backgroundColor,
                    borderRadius: ResponsiveSizeWp(20),
                    padding: ResponsiveSizeWp(20),
                    alignItems: 'center',
                    width: ResponsiveSizeWp(300),
                    paddingTop: ResponsiveSizeWp(30),
                }}>

                    <Text style={themedStyles.cardTitle} numberOfLines={2}>{t?.congratulations}</Text>

                    <Text style={themedStyles.levelText} numberOfLines={2}>{t?.level} {level?.toString()}</Text>

                    <Text style={{ fontSize: ResponsiveSizeWp(15), marginTop: ResponsiveSizeWp(10), color: theme.conceptTextColor, textAlign: 'center', fontWeight: '600', }}>
                        {t?.congratulationsLevelUp}
                    </Text>
                    <TouchableOpacity
                        style={{
                            marginTop: ResponsiveSizeWp(25),
                            backgroundColor: theme.xpFillColor,
                            paddingVertical: ResponsiveSizeWp(12),
                            paddingHorizontal: ResponsiveSizeWp(32),
                            borderRadius: ResponsiveSizeWp(8)
                        }}
                        onPress={onDismiss}
                    >
                        <Text style={themedStyles.nextButtonText}>{t?.continue}</Text>
                    </TouchableOpacity>
                </View>
            </View>
            :
            null
    )
}

export default LevelUpModal

const styles = (theme: any) => StyleSheet.create({
    nextButtonText: {
        color: theme.cardBackgroundColor,
        fontWeight: 'bold',
        fontSize: ResponsiveSizeWp(14),
    },
    cardIconContainer: {
        width: ResponsiveSizeWp(65),
        aspectRatio: 1 / 1,
        backgroundColor: theme.badgesBg,
        borderRadius: ResponsiveSizeWp(20),
        padding: ResponsiveSizeWp(12),
        marginBottom: ResponsiveSizeWp(5),
        marginTop: ResponsiveSizeWp(15),
    },
    cardIcon: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    cardTitle: {
        fontSize: ResponsiveSizeWp(18),
        fontWeight: 'bold',
        color: theme.nameTextColor,
        textAlign: 'center',
    },
    levelText: {
        fontSize: ResponsiveSizeWp(40),
        fontWeight: '800',
        color: theme.streakColor,
        textAlign: 'center',
        marginTop: ResponsiveSizeWp(10),
    },
})