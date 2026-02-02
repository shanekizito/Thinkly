// app/badgesScreen.tsx
import { useLocalization } from '@/src/contexts/LocalizationContext';
import { useBadges } from '@/src/hooks/useBadges';
import { ResponsiveSizeWp } from '@/src/utility/responsive';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/hooks/useTheme';

export default function BadgesScreen() {
  const topSpace = useSafeAreaInsets().top;
  const { t } = useLocalization();
  const { badges, achivedBadges } = useBadges();
  const theme = useTheme();
  const themedStyles = styles(theme);

  const barWidth = achivedBadges?.length * 100 / badges?.length;

  const checkAchivement = (slug:string) => achivedBadges.some(badge => badge == slug);

  return (
    <ScrollView 
      style={[themedStyles.container,{paddingTop: topSpace}]}
      contentContainerStyle={themedStyles.contentContainer}
      bounces={false}
    >
      <View style={themedStyles.header}>
        <Text style={themedStyles.titleText}>{t?.yourBadges}</Text>
        <Text style={themedStyles.descText}>{t?.yourBadgesDesc}</Text>

        <Text style={themedStyles.totalText}>{t?.totalBadges} {achivedBadges?.length} / {badges?.length}</Text>
        <View style={themedStyles.xpBar}>
          <View style={[themedStyles.xpFill, { width: `${barWidth}%` }]} />
        </View>
      </View>

      <View style={themedStyles.badgeContainer}>
        <BadgeCard
          themedStyles={themedStyles}
          data={badges[0]}
          achived={checkAchivement(badges[0]?.slug)}
          round
        />
        <BadgeCard
          themedStyles={themedStyles}
          data={badges[1]}
          achived={checkAchivement(badges[1]?.slug)}
        />
      </View>

      <View style={themedStyles.badgeContainer}>
        <BadgeCard
          themedStyles={themedStyles}
          data={badges[2]}
          achived={checkAchivement(badges[2]?.slug)}
        />
        <BadgeCard
          themedStyles={themedStyles}
          data={badges[3]}
          achived={checkAchivement(badges[3]?.slug)}
        />
      </View>

      <View style={themedStyles.badgeContainer}>
        <BadgeCard
          themedStyles={themedStyles}
          data={badges[4]}
          achived={checkAchivement(badges[4]?.slug)}
        />
        <BadgeCard
          themedStyles={themedStyles}
          data={badges[5]}
          achived={checkAchivement(badges[5]?.slug)}
        />
      </View>
    </ScrollView>
  );
}

type BadgeCardProps = {
  themedStyles: any;
  data: Object,
  achived: boolean,
  round: boolean | undefined,
}

const BadgeCard = ({ themedStyles, data, achived, round } : BadgeCardProps)=>{
  return (
    <View style={themedStyles.card}>
      <View style={[themedStyles.cardIconContainer, achived && {backgroundColor: data?.color }, round && {borderRadius: ResponsiveSizeWp(100),}]}>
        <Image
          source={data?.icon}
          style={themedStyles.cardIcon}
          resizeMode='contain'
        />
      </View>
      <Text style={themedStyles.cardTitle} numberOfLines={2}>{data?.title}</Text>
      <Text style={themedStyles.cardDesc} numberOfLines={2}>{data?.desc}</Text>
    </View>
  )
}

// themedStyles
const styles = (theme : any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  contentContainer: {
    gap: ResponsiveSizeWp(16),
    padding: ResponsiveSizeWp(20),
    paddingBottom: ResponsiveSizeWp(40),
  },
  header: {
    alignItems: 'center',
    gap: ResponsiveSizeWp(10),
    marginBottom: ResponsiveSizeWp(10),
  },
  titleText: {
    fontSize: ResponsiveSizeWp(35),
    fontWeight: 'bold',
    color: theme.nameTextColor,
    textAlign:'center',
  },
  descText:{
    fontSize: ResponsiveSizeWp(17),
    color: theme.nameTextColor,
    paddingHorizontal: ResponsiveSizeWp(10),
    textAlign:'center',
  },
  totalText:{
    fontSize: ResponsiveSizeWp(19),
    color: theme.nameTextColor,
    fontWeight:'500',
    paddingHorizontal: ResponsiveSizeWp(10),
    textAlign:'center',
    marginTop:ResponsiveSizeWp(10),
  },
  xpBar: {
    width:'65%',
    height: ResponsiveSizeWp(6),
    backgroundColor: theme.badgesBg,
    borderRadius: ResponsiveSizeWp(3),
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: theme.xpFillColor,
    borderRadius: ResponsiveSizeWp(20),
  },
  badgeContainer:{
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: ResponsiveSizeWp(16),
  },
  card:{
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    padding: ResponsiveSizeWp(15),
    backgroundColor: theme.badgeCardBg,
    borderRadius: ResponsiveSizeWp(15),
    aspectRatio: 1 / 1.05,
    gap: ResponsiveSizeWp(5),
  },
  cardIconContainer:{
    width: ResponsiveSizeWp(65),
    aspectRatio: 1/1,
    backgroundColor: theme.badgesBg,
    borderRadius: ResponsiveSizeWp(20),
    padding: ResponsiveSizeWp(12),
    marginBottom: ResponsiveSizeWp(5),
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
  cardDesc:{
    fontSize: ResponsiveSizeWp(14),
    color: theme.nameTextColor,
    textAlign:'center',
  },
}); 