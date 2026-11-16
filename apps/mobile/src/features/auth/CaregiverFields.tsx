import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { colors } from "../../theme/colors";
import { fontFamilies, fontSizes } from "../../theme/typography";

interface CaregiverFieldsProps {
  phone: string;
  onChangePhone: (text: string) => void;
  facility: string;
  onChangeFacility: (text: string) => void;
  specialty: string;
  onChangeSpecialty: (text: string) => void;
  orderNumber: string;
  onChangeOrderNumber: (text: string) => void;
}

export function CaregiverFields({
  phone,
  onChangePhone,
  facility,
  onChangeFacility,
  specialty,
  onChangeSpecialty,
  orderNumber,
  onChangeOrderNumber,
}: CaregiverFieldsProps): React.JSX.Element {
  const { t } = useTranslation("mobile");

  return (
    <View style={styles.container}>
      {/* Phone */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>
          {t("email.phoneRequired", { defaultValue: "Téléphone *" })}
        </Text>
        <TextInput
          testID="input-register-phone"
          style={styles.input}
          value={phone}
          onChangeText={onChangePhone}
          placeholder="+237 6..."
          keyboardType="phone-pad"
        />
      </View>

      {/* Facility */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>
          {t("email.facilityRequired", { defaultValue: "Établissement de santé *" })}
        </Text>
        <TextInput
          testID="input-register-facility"
          style={styles.input}
          value={facility}
          onChangeText={onChangeFacility}
          placeholder={t("email.facilityPlaceholder", { defaultValue: "Nom de l'hôpital ou du centre de santé" })}
        />
      </View>

      {/* Specialty */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>
          {t("email.specialtyRequired", { defaultValue: "Fonction / Spécialité *" })}
        </Text>
        <TextInput
          testID="input-register-specialty"
          style={styles.input}
          value={specialty}
          onChangeText={onChangeSpecialty}
          placeholder={t("email.specialtyPlaceholder", { defaultValue: "Ex : Médecin pédiatre, Infirmier(ère)..." })}
        />
      </View>

      {/* Order Number */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>
          {t("email.orderNumberOptional", { defaultValue: "Numéro d'Ordre (facultatif)" })}
        </Text>
        <TextInput
          testID="input-register-order-number"
          style={styles.input}
          value={orderNumber}
          onChangeText={onChangeOrderNumber}
          placeholder={t("email.orderNumberPlaceholder", { defaultValue: "Ex : ONMC-12345" })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 12,
  },
  fieldBlock: {
    width: "100%",
  },
  label: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base16,
    color: colors.text,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});

