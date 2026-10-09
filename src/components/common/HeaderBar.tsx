import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { useTheme } from "@/src/context/ThemeContext";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface HeaderBarProps {
  subtitle?: string;
  onNotificationPress?: () => void;
  hasUnreadNotifications?: boolean;
}

export function HeaderBar({
  subtitle = "Caloocan Government Services",
  onNotificationPress,
  hasUnreadNotifications = true,
}: HeaderBarProps) {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 16);
  const { isDarkMode } = useTheme();

  return (
    <View
      style={[
        styles.headerContainer,
        { paddingTop: topPadding },
        isDarkMode && {
          backgroundColor: "#1C2541",
          borderBottomColor: "#3A506B",
        },
      ]}
    >
      <View style={styles.innerWrapper}>
        {/* Left: Logo + App Name + Subtitle */}
        <View style={styles.leftBrand}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View style={styles.textStack}>
            <Text style={[styles.brandTitle, isDarkMode && { color: "#38BDF8" }]}>
              Civentral
            </Text>
            <Text
              style={[styles.brandSubtitle, isDarkMode && { color: "#CBD5E1" }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          </View>
        </View>

        {/* Right: Bell Notification with Red Badge */}
        <TouchableOpacity
          style={[
            styles.notificationBtn,
            isDarkMode && { backgroundColor: "#0B132B" },
          ]}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <IconSymbol
            name="bell.fill"
            size={22}
            color={isDarkMode ? "#38BDF8" : "#176B87"}
          />
          {hasUnreadNotifications && (
            <View
              style={[
                styles.redBadgeDot,
                isDarkMode && { borderColor: "#1C2541" },
              ]}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    width: "100%",
  },
  innerWrapper: {
    width: "100%",
    maxWidth: 680,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftBrand: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  logoImage: {
    width: 36,
    height: 36,
    marginRight: 10,
  },
  textStack: {
    flex: 1,
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#176B87",
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    marginTop: -1,
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  redBadgeDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
});
