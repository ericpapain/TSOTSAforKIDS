import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/colors";
import { fontFamilies, fontSizes } from "../theme/typography";

export interface ScreenItem {
  id: string;
  title: string;
  route: string;
}

export const ALL_MOBILE_SCREENS: ScreenItem[] = [
  { id: "M01", title: "Accueil / Bienvenue", route: "/u-welcome" },
  { id: "M02", title: "Connexion Google", route: "/u-google" },
  { id: "M03", title: "Inscription Téléphone", route: "/u-signup" },
  { id: "M04", title: "Connexion E-mail", route: "/u-email" },
  { id: "M05", title: "Code SMS / OTP", route: "/u-otp" },
  { id: "M06", title: "Choix des modules", route: "/u-modules" },
  { id: "M07", title: "Bientôt disponible", route: "/u-soon" },
  { id: "M08", title: "Personnes suivies", route: "/u-persons" },
  { id: "M09", title: "Ajouter une personne", route: "/u-addperson" },
  { id: "M10", title: "Consentement médical", route: "/u-consent" },
  { id: "M11", title: "Profil & Dashboard enfant", route: "/u-profile" },
  { id: "M12", title: "Choisir Produit / Aliment", route: "/u-choose" },
  { id: "M13", title: "Liste déroulante produits", route: "/u-dropdown" },
  { id: "M14", title: "F-75 Avertissement hôpital", route: "/u-f75" },
  { id: "M15", title: "Fiche produit & Équivalents", route: "/u-product" },
  { id: "M16", title: "Filtre par région", route: "/u-region" },
  { id: "M17", title: "Aucun équivalent trouvé", route: "/u-empty" },
  { id: "M18", title: "Fiche aliment brut", route: "/u-food" },
  { id: "M19", title: "Choix des nutriments", route: "/u-nutrients" },
  { id: "M20", title: "Donner un produit", route: "/u-give" },
  { id: "M21", title: "Prise enregistrée", route: "/u-given" },
  { id: "M22", title: "Historique des prises", route: "/u-history" },
  { id: "M23", title: "Indicateur Hors ligne", route: "/u-offline" },
  { id: "M24", title: "Ajouter produit personnel", route: "/u-addproduct" },
  { id: "M25", title: "Équivalents produit perso", route: "/u-myproduct-eq" },
  { id: "M26", title: "Notification lock screen", route: "/u-lock" },
  { id: "M27", title: "Centre de notifications", route: "/u-notif-center" },
  { id: "M28", title: "Réglages notifications", route: "/u-notif-settings" },
  { id: "M29", title: "Notifications désactivées", route: "/u-notif-off" },
  { id: "M30", title: "Heures prévues / Rappels", route: "/u-schedule" },
  { id: "M31", title: "Soignant en attente", route: "/s-pending" },
];

export function DevScreensList(): React.JSX.Element {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>📱 Accès direct aux 31 écrans :</Text>
      <View style={styles.list}>
        {ALL_MOBILE_SCREENS.map((screen) => (
          <TouchableOpacity
            key={screen.id}
            testID={`dev-screen-${screen.id}`}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push(screen.route as unknown as never)}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{screen.id}</Text>
            </View>
            <Text style={styles.screenTitle}>{screen.title}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md18,
    color: colors.primary,
    marginBottom: 8,
  },
  list: {
    gap: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    backgroundColor: colors.primary50,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  badgeText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: colors.primary,
  },
  screenTitle: {
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base16,
    color: colors.text,
  },
  arrow: {
    fontSize: 20,
    color: colors.textMuted,
    marginLeft: 8,
  },
});

