import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet } from "react-native";
import CategoriesMenu from "../components/CategoriesMenu";
import { CATEGORIES } from "../../lib/categories";
import theme from "../theme"; // <-- import theme

export default function CategoriesScreen() {
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.gray900 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse by Categories</Text>
      </View>
      <View style={styles.content}>
        <CategoriesMenu data={CATEGORIES} />
      </View>
    </SafeAreaView>
  );
}

function createStyles(t: typeof theme) {
  return StyleSheet.create({
    header: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: t.gray700,
    },
    title: {
      fontSize: 20,
      fontWeight: "800",
      color: t.white,
    },
    content: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
  });
}
