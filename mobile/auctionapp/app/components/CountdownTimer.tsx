import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "../../app/theme";

type CountdownTimerProps = {
  deadline: string | Date;
  onEnd?: () => void;
};

export default function CountdownTimer({ deadline, onEnd }: CountdownTimerProps) {
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

  if (!timeLeft) {
    return (
      <View style={styles.container}>
        <Text style={styles.endedText}>Auction Ended</Text>
      </View>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;
  const isUrgent = days === 0 && hours < 24;

  return (
    <View style={[styles.container, isUrgent && styles.urgent]}>
      {days > 0 && (
        <View style={styles.timeUnit}>
          <Text style={[styles.number, isUrgent && styles.urgentText]}>
            {days.toString().padStart(2, "0")}
          </Text>
          <Text style={styles.label}>d</Text>
        </View>
      )}
      <View style={styles.timeUnit}>
        <Text style={[styles.number, isUrgent && styles.urgentText]}>
          {hours.toString().padStart(2, "0")}
        </Text>
        <Text style={styles.label}>h</Text>
      </View>
      <View style={styles.separator}>
        <Text style={styles.separatorText}>:</Text>
      </View>
      <View style={styles.timeUnit}>
        <Text style={[styles.number, isUrgent && styles.urgentText]}>
          {minutes.toString().padStart(2, "0")}
        </Text>
        <Text style={styles.label}>m</Text>
      </View>
      <View style={styles.separator}>
        <Text style={styles.separatorText}>:</Text>
      </View>
      <View style={styles.timeUnit}>
        <Text style={[styles.number, isUrgent && styles.urgentText]}>
          {seconds.toString().padStart(2, "0")}
        </Text>
        <Text style={styles.label}>s</Text>
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
    color: theme.gray900,
    fontVariant: ["tabular-nums"],
  },
  urgentText: {
    color: "#FF4444",
  },
  label: {
    fontSize: 10,
    color: theme.gray500,
    fontWeight: "600",
    marginTop: 2,
  },
  separator: {
    marginHorizontal: 4,
  },
  separatorText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.gray400,
  },
  endedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF4444",
  },
});
