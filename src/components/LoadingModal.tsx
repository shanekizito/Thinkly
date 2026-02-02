import { ResponsiveSizeWp, screenHeight, screenWidth } from '@/src/utility/responsive'
import { memo } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

const LoadingModal = () => {
    return (
            <View style={styles.ViewWrapper}>
                <View style={styles.Container}>
                    <ActivityIndicator color={'#000000'} size='large' />
                </View>
            </View>
    )
}

export default memo(LoadingModal)

const styles = StyleSheet.create({
    ViewWrapper: {
        height:screenHeight,
        width:screenWidth*3,
        alignSelf:'center',
        position:'absolute',
        zIndex:1000,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    Container: {
        alignItems: "center",
        borderRadius: ResponsiveSizeWp(10),
        padding: ResponsiveSizeWp(20),
        // backgroundColor: '#fff',
        // elevation: 5,
        // shadowOffset: { width: 0, height: 5 },
        // shadowOpacity: 0.3,
        // shadowRadius: 5,
    },
})