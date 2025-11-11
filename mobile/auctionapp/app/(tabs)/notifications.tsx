import { SafeAreaView } from "react-native-safe-area-context";
import { Text, StyleSheet } from "react-native";
import theme from "../theme";

export default function Notifications() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>There is nothing in here yet, go like something ;)</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: theme.gray700,
    fontSize: 18,
    fontWeight: "600",
  },
});
