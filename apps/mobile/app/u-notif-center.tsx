import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { AppBar } from "../src/components/AppBar";
import { centerStyles } from "../src/features/notifications/centerStyles";
import {
  getInAppNotifications,
  markAsRead,
  InAppNotificationItem,
} from "../src/notifications";

export default function NotifCenterScreen(): React.JSX.Element {
  const router = useRouter();
  const [notifications, setNotifications] = useState<InAppNotificationItem[]>(() =>
    getInAppNotifications()
  );

  const handlePressItem = (item: InAppNotificationItem) => {
    if (!item.read_at) {
      markAsRead(item.id);
      setNotifications(getInAppNotifications());
    }
    if (item.target_route === "/u-history") {
      router.push("/u-history");
    } else if (item.target_route) {
      router.push({
        pathname: "/u-give",
        params: { person_name: item.person_name ?? "Amina" },
      });
    }
  };

  return (
    <View style={centerStyles.container}>
      <AppBar
        title="Notifications"
        onBack={() => router.back()}
        rightIcon="cog"
        onRightPress={() => router.push("/u-notif-settings")}
        rightAccessibilityLabel="Réglages"
      />

      <ScrollView contentContainerStyle={centerStyles.content}>
        <Text style={centerStyles.sectionTitle}>Récents</Text>

        {notifications.length === 0 ? (
          <View style={centerStyles.emptyContainer}>
            <Text style={centerStyles.emptyText}>Aucune notification</Text>
          </View>
        ) : (
          notifications.map((item) => {
            const isUnread = !item.read_at;
            return (
              <TouchableOpacity
                key={item.id}
                style={[centerStyles.card, isUnread && centerStyles.cardUnread]}
                onPress={() => handlePressItem(item)}
                testID={`notif-item-${item.id}`}
                activeOpacity={0.7}
              >
                <View style={centerStyles.cardHeader}>
                  <View style={centerStyles.badgeRow}>
                    <View
                      style={isUnread ? centerStyles.unreadDot : centerStyles.readDot}
                    />
                    <Text style={centerStyles.cardTitle}>{item.title}</Text>
                  </View>
                  <Text style={centerStyles.relativeTime}>{item.relative_time}</Text>
                </View>
                <Text style={centerStyles.cardBody}>{item.body}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
