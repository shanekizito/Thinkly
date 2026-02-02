
import { useLocalization } from "@/src/contexts/LocalizationContext";
import { useTheme } from "@/src/hooks/useTheme";
import { ResponsiveSizeWp } from "@/src/utility/responsive";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CourseSelection({
    selected,
    onSelect,
}:{selected:String,onSelect:(value:String)=>{}}) {

    const theme = useTheme();
    const themedStyles = styles(theme);
    const { t } = useLocalization();

    return (
        <View style={themedStyles.container}>
            <Text style={themedStyles.title}>
                {t.courseType}
            </Text>
            <View style={themedStyles.buttonContainer}>
                {
                    t?.courseLength?.map((type,index)=>
                        <TouchableOpacity
                            key={index}
                            onPress={()=>{ onSelect(type.key) }}
                            style={[themedStyles.buttonStyle, type.key === selected && { backgroundColor:theme.selectedCourseType }]}
                            activeOpacity={1}
                        >
                            <Text style={[themedStyles.buttonTitle, type.key === selected && { color:'#fff' }]} numberOfLines={1} >
                                {type.title}
                            </Text>

                            <Text style={[themedStyles.buttonDesc, type.key === selected && { color:'#fff' }]} numberOfLines={1} >
                                {type.desc}
                            </Text>
                        </TouchableOpacity>
                    )
                }
            </View>
        </View>
    );
}

const styles = (theme : any ) => StyleSheet.create({
    container:{
        width:'100%',
        gap: ResponsiveSizeWp(15),
        marginBottom: ResponsiveSizeWp(25),
        marginTop: ResponsiveSizeWp(5),
    },
    title: {
        fontSize: ResponsiveSizeWp(18),
        textAlign: "center",
        fontWeight:'bold',
        color: theme.nameTextColor,
    },
    buttonContainer:{
        flexDirection:'row',
        width:'100%',
        gap: ResponsiveSizeWp(15),
    },
    buttonStyle:{
        flex:1,
        height:ResponsiveSizeWp(70),
        minWidth:ResponsiveSizeWp(100),
        justifyContent:'center',
        alignItems:'center',
        backgroundColor:theme.cardBackgroundColor,
        borderRadius: ResponsiveSizeWp(10),
        gap: ResponsiveSizeWp(2),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    buttonTitle:{
        fontSize:ResponsiveSizeWp(17),
        fontWeight:'700',
        color:theme.nameTextColor,
    },
    buttonDesc:{
        fontSize:ResponsiveSizeWp(11),
        fontWeight:'500',
        color:theme.levelTextColor,
    },
});
