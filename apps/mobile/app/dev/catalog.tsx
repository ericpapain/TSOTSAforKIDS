import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AppBar,
  BottomNav,
  type BottomNavTab,
  BrandLogo,
  Button,
  Card,
  Chip,
  Field,
  ListItem,
  Notice,
  Toggle,
} from "../../src/components";
import { colors } from "../../src/theme/colors";
import { fontFamilies, fontSizes } from "../../src/theme/typography";

export default function ComponentCatalogScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation(["common", "mobile"]);
  const [toggleState, setToggleState] = useState(true);
  const [activeTab, setActiveTab] = useState<BottomNavTab>("modules");
  const [fieldValue, setFieldValue] = useState("");

  if (!__DEV__) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.devOnly}>
          <Text style={styles.devOnlyText}>
            {t("mobile:catalog.devOnly", "Le catalogue de composants est accessible uniquement en développement.")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <AppBar
        title={t("mobile:catalog.title", "Catalogue Composants")}
        onBack={() => router.replace("/u-welcome")}
        rightIcon="palette"
        onRightPress={() => {}}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Section 1: Logo */}
        <Text style={styles.sectionTitle}>1. BrandLogo</Text>
        <Card style={styles.sectionCard}>
          <Text style={styles.subTitle}>Light</Text>
          <View style={styles.logoLightWrapper}>
            <BrandLogo size={44} variant="light" />
          </View>
          <Text style={styles.subTitle}>Dark</Text>
          <View style={styles.logoDarkWrapper}>
            <BrandLogo size={44} variant="dark" />
          </View>
        </Card>

        {/* Section 2: Buttons */}
        <Text style={styles.sectionTitle}>2. Buttons</Text>
        <Card style={styles.sectionCard}>
          <Button title="Primary" onPress={() => {}} />
          <View style={styles.spacer} />
          <Button title="Outline" variant="outline" onPress={() => {}} />
          <View style={styles.spacer} />
          <Button title="Care" color={colors.care} onPress={() => {}} />
          <View style={styles.spacer} />
          <Button title="Danger" color={colors.danger} onPress={() => {}} />
          <View style={styles.spacer} />
          <Button title="Disabled" disabled onPress={() => {}} />
        </Card>

        {/* Section 3: Chips */}
        <Text style={styles.sectionTitle}>3. Chips</Text>
        <Card style={[styles.sectionCard, styles.rowWrap]}>
          <Chip label="Optimal" backgroundColor={colors.primary50} textColor={colors.primary} />
          <Chip label="New" backgroundColor={colors.accent50} textColor={colors.accent} />
          <Chip label="Urgent" backgroundColor={colors.danger50} textColor={colors.danger} />
          <Chip label="Warning" backgroundColor={colors.warning50} textColor={colors.warning900} />
        </Card>

        {/* Section 4: List Items */}
        <Text style={styles.sectionTitle}>4. ListItems</Text>
        <Card style={styles.sectionCard}>
          <ListItem
            title="Arachide / Peanut"
            subtitle="Zinc · 100g"
            icon="leaf"
            onPress={() => {}}
          />
          <View style={styles.spacer} />
          <ListItem
            title="Samuel (#A-014)"
            subtitle="2h"
            icon="user"
            badge={<Chip label="MAS" backgroundColor={colors.danger50} textColor={colors.danger} />}
            onPress={() => {}}
          />
        </Card>

        {/* Section 5: Field */}
        <Text style={styles.sectionTitle}>5. Field</Text>
        <Card style={styles.sectionCard}>
          <Field
            label="Child name"
            placeholder="Amina"
            value={fieldValue}
            onChangeText={setFieldValue}
          />
          <Field
            label="Phone"
            placeholder="+237 6..."
            error="E.164"
          />
        </Card>

        {/* Section 6: Toggle & Notice */}
        <Text style={styles.sectionTitle}>6. Toggle & Notice</Text>
        <Card style={styles.sectionCard}>
          <View style={styles.toggleRow}>
            <Text style={styles.label}>{t("mobile:settings.reminderSwitches", "Rappels")}</Text>
            <Toggle value={toggleState} onValueChange={setToggleState} />
          </View>
          <View style={styles.spacer} />
          <Notice message={t("mobile:empty.advice", "Conseil")} />
        </Card>

        {/* Section 7: BottomNav Preview */}
        <Text style={styles.sectionTitle}>7. BottomNav</Text>
        <View style={styles.bottomNavPreview}>
          <BottomNav activeTab={activeTab} onTabPress={setActiveTab} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  devOnly: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  devOnlyText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base16,
    color: colors.textMuted,
    textAlign: "center",
  },
  scroll: {
    padding: 17,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md18,
    color: colors.text,
    marginTop: 18,
    marginBottom: 8,
  },
  sectionCard: {
    padding: 14,
    marginBottom: 4,
  },
  subTitle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    color: colors.textMuted,
    marginBottom: 6,
  },
  logoLightWrapper: {
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 12,
  },
  logoDarkWrapper: {
    padding: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginBottom: 4,
  },
  spacer: {
    height: 10,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.text,
  },
  bottomNavPreview: {
    borderRadius: 9,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
});

