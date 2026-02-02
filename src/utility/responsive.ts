import { Dimensions, PixelRatio, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info'; // https://www.npmjs.com/package/react-native-device-info
import { useSafeAreaInsets } from "react-native-safe-area-context"; // https://www.npmjs.com/package/react-native-safe-area-context

// Retrieve initial screen's width
export const screenWidth = Dimensions.get('window').width;

// Retrieve initial screen's height
export const screenHeight = Dimensions.get('window').height + (Platform.OS == 'ios' ? 0 : 50);

export const widthPercentageToDP = (widthPercent: string | number) => {
  // Parse string percentage input and convert it to number.
  const elemWidth = typeof widthPercent === "number" ? widthPercent : parseFloat(widthPercent);

  // Use PixelRatio.roundToNearestPixel method in order to round the layout
  // size (dp) to the nearest one that correspons to an integer number of pixels.
  return PixelRatio.roundToNearestPixel(screenWidth * elemWidth / 100);
};

export const ResponsiveSizeWp = (size: number) => {
  return DeviceInfo.isTablet() ? widthPercentageToDP(size * 0.17) : widthPercentageToDP(size * 0.25);
};

export const heightPercentageToDP = (heightPercent: string | number) => {
  // Parse string percentage input and convert it to number.
  const elemHeight = typeof heightPercent === "number" ? heightPercent : parseFloat(heightPercent);

  // Use PixelRatio.roundToNearestPixel method in order to round the layout
  // size (dp) to the nearest one that correspons to an integer number of pixels.
  return PixelRatio.roundToNearestPixel(screenHeight * elemHeight / 100);
};

export const ResponsiveSizeHp = (size: number) => {
  return DeviceInfo.isTablet() ? heightPercentageToDP(size * 0.17) : heightPercentageToDP(size * 0.25);
};


export const useTopSafeArea = () => {
  const insets = useSafeAreaInsets();
  return insets.top;
}

export const useTopPadding = () => {
  const value = useTopSafeArea();
  const space = (Platform.OS === 'android' || !DeviceInfo.hasNotch()) ? value + ResponsiveSizeWp(15) : value
  return Math.min(space, ResponsiveSizeWp(40));
}

export const useBottomSafeArea = () => {
  const insets = useSafeAreaInsets();
  return insets.bottom;
}

export const useBottomPadding = () => {
  const value = useBottomSafeArea();
  return Platform.OS === 'android' ? value + ResponsiveSizeWp(15) : ResponsiveSizeWp(15);
}

export const BOTTOM_TAB_HEIGHT = ResponsiveSizeWp(60);