import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../app/theme";
import { useTheme } from "../../src/contexts/ThemeContext";

type CountdownTimerProps = {
  deadline: string | Date;
  onEnd?: () => void;
};

export default function CountdownTimer({ deadline, onEnd }: CountdownTimerProps) {
  const { isDarkMode: isDark, themeColors } = useTheme();
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(deadline).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft(null);
        onEnd?.();
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [deadline, onEnd]);

  const numberColor = isDark ? themeColors.text : theme.gray700;
  const labelColor = isDark ? themeColors.textSecondary : theme.gray500;
  const separatorColor = isDark ? themeColors.textSecondary : theme.gray400;

  if (!timeLeft) {
    return (
      <View style={styles.container}>
        <Text style={styles.endedText}>Дуудлага дууссан</Text>
      </View>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;
  const isUrgent = days === 0 && hours < 2;

  return (
    <View style={[styles.container, isUrgent && styles.urgent]}>
      {days > 0 && (
        <View style={styles.timeUnit}>
          <Text style={[styles.number, { color: isUrgent ? "#FF4444" : numberColor }]}>
            {days.toString().padStart(2, "0")}
          </Text>
          <Text style={[styles.label, { color: labelColor }]}>Ө</Text>
        </View>
      )}
      <View style={styles.timeUnit}>
        <Text style={[styles.number, { color: isUrgent ? "#FF4444" : numberColor }]}>
          {hours.toString().padStart(2, "0")}
        </Text>
        <Text style={[styles.label, { color: labelColor }]}>Ц</Text>
      </View>
      <View style={styles.separator}>
        <Text style={[styles.separatorText, { color: isUrgent ? "#FF4444" : separatorColor }]}>:</Text>
      </View>
      <View style={styles.timeUnit}>
        <Text style={[styles.number, { color: isUrgent ? "#FF4444" : numberColor }]}>
          {minutes.toString().padStart(2, "0")}
        </Text>
        <Text style={[styles.label, { color: labelColor }]}>М</Text>
      </View>
      <View style={styles.separator}>
        <Text style={[styles.separatorText, { color: isUrgent ? "#FF4444" : separatorColor }]}>:</Text>
      </View>
      <View style={styles.timeUnit}>
        <Text style={[styles.number, { color: isUrgent ? "#FF4444" : numberColor }]}>
          {seconds.toString().padStart(2, "0")}
        </Text>
        <Text style={[styles.label, { color: labelColor }]}>С</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  urgent: {
    backgroundColor: "#FF444420",
    borderRadius: 8,
    padding: 4,
  },
  timeUnit: {
    alignItems: "center",
    minWidth: 30,
  },
  number: {
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  separator: {
    marginHorizontal: 4,
  },
  separatorText: {
    fontSize: 16,
    fontWeight: "700",
  },
  endedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF4444",
  },
});
