import { useLocalization } from '@/src/contexts/LocalizationContext';
import { BOTTOM_TAB_HEIGHT, ResponsiveSizeWp } from '@/src/utility/responsive';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';

type Props = {
  active: 'home' | 'overview' | 'profile';
  onTabPress: (tab: 'home' | 'overview' | 'profile') => void;
};

export default function BottomBar({ active, onTabPress }: Props) {
  const theme = useTheme();
  const { t } = useLocalization();
  const themedStyles = styles(theme);

  return (
    <View style={themedStyles.bottomNav}>
      <TouchableOpacity style={themedStyles.navItem}
        onPress={() => onTabPress('home')}
        activeOpacity={1}
      >
        <Ionicons name="home-outline" size={ResponsiveSizeWp(22)} color={active === 'home' ?theme.nameTextColor:theme.levelTextColor} />
        <Text style={active === 'home' ? themedStyles.activeNavText : themedStyles.navText}>{t?.home}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={themedStyles.navItem}
        onPress={() => onTabPress('overview')}
        activeOpacity={1}
      >
        <Ionicons name="list-outline" size={ResponsiveSizeWp(22)} color={active === 'overview' ?theme.nameTextColor:theme.levelTextColor} />
        <Text style={active === 'overview' ? themedStyles.activeNavText : themedStyles.navText}>{t?.overview}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={themedStyles.navItem}
        onPress={() => onTabPress('profile')}
        activeOpacity={1}
      >
        <Ionicons name="person-outline" size={ResponsiveSizeWp(22)} color={active === 'profile' ?theme.nameTextColor:theme.levelTextColor} />
        <Text style={active === 'profile' ? themedStyles.activeNavText : themedStyles.navText}>{t?.profile}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = (theme : any) => StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: ResponsiveSizeWp(1),
    borderTopColor: theme.borderColor,
    height: BOTTOM_TAB_HEIGHT,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: ResponsiveSizeWp(2),
    flex: 1,
  },
  navText: {
    color: theme.levelTextColor,
    fontSize: ResponsiveSizeWp(13),
  },
  activeNavText: {
    color: theme.nameTextColor,
    fontWeight: 'bold',
    fontSize: ResponsiveSizeWp(13),
  },
});