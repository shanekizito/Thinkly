import { useBadgeEarn } from '@/src/contexts/BadgesContext';
import { useLocalization } from '@/src/contexts/LocalizationContext';
import { useBadges } from '@/src/hooks/useBadges';
import { useTheme } from '@/src/hooks/useTheme';
import { ResponsiveSizeWp } from '@/src/utility/responsive';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BadgeEarnModal = () => {
    const { earnedBadge, setEarnedBadge } = useBadgeEarn();
    const { badges } = useBadges();
    const { t } = useLocalization();
    const theme = useTheme();
    const themedStyles = styles(theme);

    const badge = badges?.find((badge)=> badge.slug === earnedBadge);

    const handleDismiss = ()=>{ setEarnedBadge(''); }

    return (
        <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            position:'absolute',
            zIndex: 1000000000,
            height:'100%',
            width:'100%',
        }}>
                <View style={{
                    backgroundColor: theme.backgroundColor,
                    borderRadius: ResponsiveSizeWp(20),
                    padding: ResponsiveSizeWp(20),
                    alignItems: 'center',
                    width: ResponsiveSizeWp(300)
                }}>
                    <View style={[themedStyles.cardIconContainer,{backgroundColor: badge?.color }]}>
                        <Image
                            source={badge?.icon}
                            style={themedStyles.cardIcon}
                            resizeMode='contain'
                        />
                    </View>

                    <Text style={themedStyles.cardTitle} numberOfLines={2}>{badge?.title}</Text>
                    
                    <Text style={{ fontSize: ResponsiveSizeWp(15), marginTop: ResponsiveSizeWp(15), color: theme.conceptTextColor ,textAlign:'center', fontWeight:'600' ,paddingHorizontal: ResponsiveSizeWp(20)}}>
                        {t?.congratulationsYouEarnedNewBadge}
                    </Text>
                    <TouchableOpacity
                        style={{
                            marginTop: ResponsiveSizeWp(25),
                            backgroundColor: theme.xpFillColor,
                            paddingVertical: ResponsiveSizeWp(12),
                            paddingHorizontal: ResponsiveSizeWp(32),
                            borderRadius: ResponsiveSizeWp(8)
                        }}
                        onPress={handleDismiss}
                    >
                        <Text style={themedStyles.nextButtonText}>{t?.continue}</Text>
                    </TouchableOpacity>
                </View>
        </View>
    )
}

export default BadgeEarnModal

const styles = (theme : any) => StyleSheet.create({
    nextButtonText:{
        color: theme.cardBackgroundColor,
        fontWeight: 'bold',
        fontSize:ResponsiveSizeWp(14),
    },
    cardIconContainer:{
        width: ResponsiveSizeWp(65),
        aspectRatio: 1/1,
        backgroundColor: theme.badgesBg,
        borderRadius: ResponsiveSizeWp(20),
        padding: ResponsiveSizeWp(12),
        marginBottom: ResponsiveSizeWp(5),
        marginTop: ResponsiveSizeWp(15),
    },
    cardIcon:{
        width:'100%',
        height:'100%',
        opacity: 0.8,
    },
    cardTitle:{
        fontSize: ResponsiveSizeWp(18),
        fontWeight: 'bold',
        color: theme.nameTextColor,
        textAlign:'center',
    },
})