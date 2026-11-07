import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBar } from "../src/components/AppBar";
import { BottomNav, type BottomNavTab } from "../src/components/BottomNav";
import { fetchFamilyMembers } from "../src/features/persons/personsService";
import type { PersonItem } from "../src/features/persons/types";
import { colors } from "../src/theme/colors";
import { fontFamilies, fontSizes } from "../src/theme/typography";

export default function PersonsScreen(): React.JSX.Element {
  const router = useRouter();
  const [persons, setPersons] = useState<PersonItem[]>([]);

  useEffect(() => {
    fetchFamilyMembers()
      .then((data) => {
        if (data.length > 0) {
          setPersons(data);
        } else {
          // Default initial demo persons matching prompt M08
          setPersons([
            {
              id: "amina-demo",
              first_name: "Amina",
              birth_date: "2024-12-12",
              sex: "F",
              age_formatted: "1 an 11 mois",
              relation: "child",
              status_badge: "Démo",
            },
            {
              id: "self-demo",
              first_name: "Moi-même",
              birth_date: "1990-01-01",
              sex: "M",
              age_formatted: "adulte",
              relation: "self",
            },
          ]);
        }
      })
      .catch(() => {});
  }, []);

  const handleTabPress = (tab: BottomNavTab): void => {
    if (tab === "persons") return;
    if (tab === "modules") router.push("/u-modules");
    if (tab === "products") router.push("/u-choose");
    if (tab === "intakes") router.push("/u-history");
  };

  const handleSelectPerson = (person: PersonItem): void => {
    router.push({
      pathname: "/u-profile",
      params: { personId: person.id, name: person.first_name },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppBar
        title="Nutrition"
        onBack={() => router.replace("/u-modules")}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Pour qui ?</Text>

        {/* Persons list */}
        <View style={styles.personsList}>
          {persons.map((person) => {
            const isChild = person.relation === "child" || person.first_name === "Amina";
            const subtitle = isChild
              ? "Suivie par le CMA de démo"
              : "Profil à compléter";

            return (
              <Pressable
                key={person.id}
                testID={`card-person-${person.id}`}
                style={({ pressed }) => [
                  styles.personCard,
                  pressed && styles.pressed,
                ]}
                onPress={() => handleSelectPerson(person)}
              >
                <View style={styles.iconCol}>
                  <FontAwesome5
                    name={isChild ? "child" : "user"}
                    size={32}
                    color={isChild ? colors.primary : colors.textSubtle}
                  />
                </View>

                <View style={styles.textCol}>
                  <Text style={styles.personTitle}>
                    {person.first_name} · {person.age_formatted || "enfant"}
                  </Text>
                  <Text style={styles.personSubtitle}>{subtitle}</Text>
                </View>

                {person.status_badge && (
                  <View style={styles.badgePill}>
                    <Text style={styles.badgeText}>{person.status_badge}</Text>
                  </View>
                )}

                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Add Person button */}
        <Pressable
          testID="btn-add-person"
          style={({ pressed }) => [
            styles.addPersonButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/u-addperson")}
        >
          <FontAwesome5 name="plus" size={30} color={colors.primary} />
          <Text style={styles.addPersonText}>Ajouter une personne</Text>
        </Pressable>

        {/* Explore without profile link */}
        <Pressable
          testID="btn-explore-no-profile"
          style={({ pressed }) => [
            styles.exploreButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/u-choose")}
        >
          <Text style={styles.exploreText}>Explorer les produits sans profil  ›</Text>
        </Pressable>

        {/* Info box: no account needed for family members */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Ajoutez les membres de votre famille : pas besoin de leur créer un compte.
          </Text>
        </View>
      </ScrollView>

      <BottomNav activeTab="persons" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    paddingHorizontal: 17,
    paddingTop: 18,
    paddingBottom: 24,
  },
  heading: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg22,
    color: colors.text,
    marginBottom: 16,
  },
  personsList: {
    gap: 12,
    marginBottom: 20,
  },
  personCard: {
    width: "100%",
    height: 89,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  iconCol: {
    width: 32,
    alignItems: "center",
    marginRight: 14,
  },
  textCol: {
    flex: 1,
  },
  personTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md18,
    color: colors.text,
    marginBottom: 2,
  },
  personSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.textMuted,
  },
  badgePill: {
    backgroundColor: colors.accent50,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
  },
  badgeText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: colors.accent700,
  },
  chevron: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xl25,
    color: colors.textSubtle,
    marginLeft: 6,
  },
  addPersonButton: {
    width: "100%",
    height: 71,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 17,
    gap: 14,
    marginBottom: 24,
  },
  addPersonText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md19,
    color: colors.primary,
  },
  exploreButton: {
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  exploreText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md18,
    color: colors.primary,
    textAlign: "center",
  },
  infoBox: {
    backgroundColor: colors.primary50,
    borderRadius: 9,
    padding: 16,
  },
  infoText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.primary,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.85,
  },
});
