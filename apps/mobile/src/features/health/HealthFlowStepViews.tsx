import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "../../theme/colors";
import { flowStyles as styles } from "./healthFlowStyles";
import type {
  MobileSymptomItem,
  MobileHealthEventOut,
} from "./healthTypes";

export const Step1SymptomChoice: React.FC<{
  catalog: MobileSymptomItem[];
  selectedCode: string;
  loading: boolean;
  onSelectCode: (code: string) => void;
  onContinue: () => void;
}> = ({ catalog, selectedCode, loading, onSelectCode, onContinue }) => {
  const { t } = useTranslation(["mobile", "common", "medical"]);
  return (
  <View testID="step-1-symptom-choice" style={styles.stepContainer}>
    <Text style={styles.stepQuestion}>
      {t("mobile:health.step1Heading", { defaultValue: "Quel changement observez-vous chez votre enfant ?" })}
    </Text>
    {loading ? (
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
    ) : (
      <View style={styles.symptomsList}>
        {catalog.map((sym) => {
          const isSelected = selectedCode === sym.code;
          return (
            <TouchableOpacity
              key={sym.code}
              testID={`symptom-item-${sym.code}`}
              style={[
                styles.symptomCard,
                isSelected && (sym.is_danger_sign ? styles.dangerCardSelected : styles.cardSelected),
              ]}
              activeOpacity={0.8}
              onPress={() => onSelectCode(sym.code)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.symptomLabel, isSelected && styles.symptomLabelSelected]}>
                  {sym.label_fr}
                </Text>
              </View>
              {sym.is_danger_sign && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentBadgeText}>
                    {t("mobile:health.urgentBadge", { defaultValue: "Urgent" })}
                  </Text>
                </View>
              )}
              <FontAwesome5
                name={isSelected ? "check-circle" : "circle"}
                size={18}
                color={isSelected ? (sym.is_danger_sign ? "#B91C1C" : colors.primary) : colors.textSubtle}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    )}

    <TouchableOpacity
      testID="btn-continue-step-1"
      disabled={!selectedCode}
      style={[styles.continueBtn, !selectedCode && styles.btnDisabled]}
      onPress={onContinue}
    >
      <Text style={styles.continueBtnText}>
        {t("common:actions.continue", { defaultValue: "Continuer" })}
      </Text>
    </TouchableOpacity>
  </View>
  );
};

export const Step2DurationDetails: React.FC<{
  selectedCode: string;
  durationKey: string;
  tempCelsius: string;
  stoolsPerDay: string;
  vomitPerDay: string;
  hasBlood: boolean;
  onSelectDuration: (d: string) => void;
  setTempCelsius: (v: string) => void;
  setStoolsPerDay: (v: string) => void;
  setVomitPerDay: (v: string) => void;
  setHasBlood: (v: boolean) => void;
  onContinue: () => void;
}> = ({
  selectedCode,
  durationKey,
  tempCelsius,
  stoolsPerDay,
  vomitPerDay,
  hasBlood,
  onSelectDuration,
  setTempCelsius,
  setStoolsPerDay,
  setVomitPerDay,
  setHasBlood,
  onContinue,
}) => {
  const { t } = useTranslation(["mobile", "common", "medical"]);
  return (
  <View testID="step-2-duration-details" style={styles.stepContainer}>
    <Text style={styles.stepQuestion}>
      {t("mobile:health.durationQuestion", { defaultValue: "Depuis combien de temps ce signe est-il présent ?" })}
    </Text>

    <View style={styles.durationOptions}>
      {[
        { key: "less_than_24h", label: "Moins de 24 heures" },
        { key: "1_to_3_days", label: "1 à 3 jours" },
        { key: "4_to_13_days", label: "4 à 13 jours" },
        { key: "14_days_or_more", label: "14 jours ou plus (prolongé)" },
      ].map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[styles.durationItem, durationKey === opt.key && styles.cardSelected]}
          onPress={() => onSelectDuration(opt.key)}
        >
          <Text style={[styles.durationText, durationKey === opt.key && styles.symptomLabelSelected]}>
            {opt.label}
          </Text>
          {durationKey === opt.key && <FontAwesome5 name="check" size={14} color={colors.primary} />}
        </TouchableOpacity>
      ))}
    </View>

    {selectedCode === "fever" && (
      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>
          {t("mobile:health.tempLabel", { defaultValue: "Température mesurée (°C, facultatif)" })}
        </Text>
        <TextInput
          testID="input-temperature"
          style={styles.textInput}
          keyboardType="numeric"
          placeholder="38.5"
          value={tempCelsius}
          onChangeText={setTempCelsius}
        />
      </View>
    )}

    {selectedCode === "diarrhea" && (
      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>
          {t("mobile:health.stoolsLabel", { defaultValue: "Nombre d'émissions de selles aujourd'hui" })}
        </Text>
        <TextInput
          testID="input-stools"
          style={styles.textInput}
          keyboardType="numeric"
          placeholder="4"
          value={stoolsPerDay}
          onChangeText={setStoolsPerDay}
        />
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setHasBlood(!hasBlood)}
        >
          <FontAwesome5 name={hasBlood ? "check-square" : "square"} size={18} color={colors.primary} />
          <Text style={styles.checkboxLabel}>
            {t("mobile:health.bloodInStools", { defaultValue: "Présence de sang visible dans les selles" })}
          </Text>
        </TouchableOpacity>
      </View>
    )}

    {selectedCode === "vomiting" && (
      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>
          {t("mobile:health.vomitLabel", { defaultValue: "Nombre d'épisodes de vomissements aujourd'hui" })}
        </Text>
        <TextInput
          testID="input-vomit"
          style={styles.textInput}
          keyboardType="numeric"
          placeholder="3"
          value={vomitPerDay}
          onChangeText={setVomitPerDay}
        />
      </View>
    )}

    <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
      <Text style={styles.continueBtnText}>
        {t("common:actions.continue", { defaultValue: "Continuer" })}
      </Text>
    </TouchableOpacity>
  </View>
  );
};

export const Step3Context: React.FC<{
  duringMeal: boolean;
  notes: string;
  setDuringMeal: (v: boolean) => void;
  setNotes: (v: string) => void;
  onContinue: () => void;
}> = ({ duringMeal, notes, setDuringMeal, setNotes, onContinue }) => {
  const { t } = useTranslation(["mobile", "common", "medical"]);
  return (
  <View testID="step-3-context" style={styles.stepContainer}>
    <Text style={styles.stepQuestion}>
      {t("mobile:health.contextHeading", { defaultValue: "Contexte d'apparition" })}
    </Text>

    <TouchableOpacity
      style={[styles.duringMealCard, duringMeal && styles.duringMealCardActive]}
      onPress={() => setDuringMeal(!duringMeal)}
    >
      <FontAwesome5 name="utensils" size={20} color={duringMeal ? colors.primary : colors.textSubtle} />
      <View style={{ flex: 1 }}>
        <Text style={styles.duringMealTitle}>
          {t("mobile:health.duringMealTitle", { defaultValue: "Survenu pendant ou juste après un repas" })}
        </Text>
        <Text style={styles.duringMealDesc}>
          {t("mobile:health.duringMealDesc", { defaultValue: "Cochez cette case si le signe est lié à une prise d'aliment" })}
        </Text>
      </View>
      <FontAwesome5 name={duringMeal ? "check-circle" : "circle"} size={18} color={duringMeal ? colors.primary : colors.textSubtle} />
    </TouchableOpacity>

    <View style={styles.fieldBox}>
      <Text style={styles.fieldLabel}>
        {t("mobile:health.commentLabel", { defaultValue: "Remarques ou détails supplémentaires" })}
      </Text>
      <TextInput
        testID="input-health-notes"
        style={[styles.textInput, { height: 90, textAlignVertical: "top" }]}
        multiline
        placeholder={t("mobile:health.commentPlaceholder", { defaultValue: "Décrivez ce que vous observez (comportement, teint, soif...)" })}
        value={notes}
        onChangeText={setNotes}
      />
    </View>

    <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
      <Text style={styles.continueBtnText}>
        {t("mobile:health.summaryBtn", { defaultValue: "Vérifier le récapitulatif" })}
      </Text>
    </TouchableOpacity>
  </View>
  );
};

export const Step4Summary: React.FC<{
  currentSymptom?: MobileSymptomItem;
  durationKey: string;
  duringMeal: boolean;
  notes: string;
  submitting: boolean;
  onSubmit: () => void;
}> = ({ currentSymptom, durationKey, duringMeal, notes, submitting, onSubmit }) => {
  const { t } = useTranslation(["mobile", "common", "medical"]);
  return (
  <View testID="step-4-summary" style={styles.stepContainer}>
    <Text style={styles.stepQuestion}>
      {t("mobile:health.summaryTitle", { defaultValue: "Récapitulatif de votre signalement" })}
    </Text>

    <View style={styles.summaryBox}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>{t("mobile:health.signLabel", { defaultValue: "Signe" })} :</Text>
        <Text style={styles.summaryVal}>{currentSymptom?.label_fr}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>{t("mobile:health.durationLabel", { defaultValue: "Durée" })} :</Text>
        <Text style={styles.summaryVal}>{durationKey}</Text>
      </View>
      {duringMeal && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t("mobile:health.mealLabel", { defaultValue: "Repas" })} :</Text>
          <Text style={styles.summaryVal}>Lié à l'alimentation</Text>
        </View>
      )}
      {notes.length > 0 && (
        <View style={{ marginTop: 6 }}>
          <Text style={styles.summaryLabel}>{t("mobile:health.notesLabel", { defaultValue: "Observations" })} :</Text>
          <Text style={styles.summaryNotes}>&laquo; {notes} &raquo;</Text>
        </View>
      )}
    </View>

    <TouchableOpacity
      testID="btn-confirm-send-health"
      disabled={submitting}
      style={[styles.confirmBtn, submitting && styles.btnDisabled]}
      onPress={onSubmit}
    >
      {submitting ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.continueBtnText}>
          {t("mobile:health.sendBtn", { defaultValue: "Confirmer et transmettre au médecin" })}
        </Text>
      )}
    </TouchableOpacity>
  </View>
  );
};

export const Step5Guidance: React.FC<{
  submissionResult: MobileHealthEventOut | null;
  onFinish: () => void;
}> = ({ submissionResult, onFinish }) => {
  const { t } = useTranslation(["mobile", "common", "medical"]);
  return (
  <View testID="step-5-guidance" style={styles.stepContainer}>
    <View style={styles.outcomeIconCircle}>
      <FontAwesome5
        name={submissionResult?.has_danger_sign ? "exclamation-triangle" : "check-circle"}
        size={48}
        color={submissionResult?.has_danger_sign ? "#DC2626" : colors.primary}
      />
    </View>

    <Text style={styles.outcomeTitle}>
      {submissionResult?.has_danger_sign
        ? t("mobile:health.dangerOutcomeTitle", { defaultValue: "Orientation d'urgence" })
        : t("mobile:health.recordedOutcomeTitle", { defaultValue: "Signalement transmis avec succès" })}
    </Text>

    <View style={styles.guidanceBox}>
      <Text style={styles.guidanceText}>
        {submissionResult?.parent_guidance_message ||
          t("mobile:health.defaultGuidance", {
            defaultValue: "Votre soignant référent a reçu votre alerte et vous contactera rapidement si nécessaire.",
          })}
      </Text>
    </View>

    <TouchableOpacity
      testID="btn-finish-health-flow"
      style={styles.continueBtn}
      onPress={onFinish}
    >
      <Text style={styles.continueBtnText}>
        {t("common:actions.close", { defaultValue: "Terminer et retourner au profil" })}
      </Text>
    </TouchableOpacity>
  </View>
  );
};


