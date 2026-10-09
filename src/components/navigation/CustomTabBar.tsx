import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { useTheme } from "@/src/context/ThemeContext";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  // Responsive floating pill dimensions
  const maxBarWidth = 520;
  const barWidth = Math.min(windowWidth - 32, maxBarWidth);
  const leftPosition = Math.max((windowWidth - barWidth) / 2, 16);
  const bottomPosition = Math.max(insets.bottom + 8, 20);

  // Only display the 5 main tabs (Home, Services, SOS, Tracker, Profile)
  const validTabNames = ["index", "services", "sos", "tracker", "profile"];
  const routesToDisplay = state.routes.filter((r) =>
    validTabNames.includes(r.name),
  );

  return (
    <View
      style={[
        styles.container,
        {
          width: barWidth,
          left: leftPosition,
          right: "auto",
          bottom: bottomPosition,
        },
        isDarkMode && { backgroundColor: "#1C2541", borderColor: "#3A506B" },
      ]}
    >
      {routesToDisplay.map((route) => {
        const { options } = descriptors[route.key];
        const isFocused = state.routes[state.index]?.key === route.key;
        const isSOS = route.name === "sos";

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        // Render Prominent Raised SOS Center Button
        if (isSOS) {
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.85}
              style={styles.sosButtonContainer}
            >
              <View style={[styles.sosCircle, isDarkMode && { borderColor: "#1C2541" }]}>
                <IconSymbol name="shield.fill" size={30} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          );
        }

        // Determine Icon Name and Label for Standard Tabs
        let iconName = "house.fill";
        let label = "Home";

        if (route.name === "index") {
          iconName = "house.fill";
          label = "Home";
        } else if (route.name === "services") {
          iconName = "square.grid.2x2.fill";
          label = "Services";
        } else if (route.name === "tracker") {
          iconName = "doc.text.fill";
          label = "Transaction";
        } else if (route.name === "profile") {
          iconName = "person.crop.circle.fill";
          label = "Profile";
        }

        const activeColor = isDarkMode ? "#38BDF8" : "#176B87";
        const inactiveColor = isDarkMode ? "#64748B" : "#94A3B8";
        const currentColor = isFocused ? activeColor : inactiveColor;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            <IconSymbol name={iconName as any} size={22} color={currentColor} />
            <Text style={[styles.tabLabel, { color: currentColor }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 36,
    height: 60,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",

    // Heavy Drop Shadow for Floating Pill Aesthetic
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
  },
  sosButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 64,
  },
  sosCircle: {
    position: "absolute",
    top: -34,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",

    // White Highlight Border
    borderWidth: 3.5,
    borderColor: "#FFFFFF",

    // Elevated Drop Shadow
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
  },
});
