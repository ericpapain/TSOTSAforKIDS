import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "../src/theme/colors";
import { AppBar } from "../src/components/AppBar";
import {
  fetchSymptomCatalog,
  submitHealthEvent,
} from "../src/features/health/healthService";
import { flowStyles as styles } from "../src/features/health/healthFlowStyles";
import {
  Step1SymptomChoice,
  Step2DurationDetails,
  Step3Context,
  Step4Summary,
  Step5Guidance,
} from "../src/features/health/HealthFlowStepViews";
import type {
  MobileSymptomItem,
  MobileHealthEventOut,
} from "../src/features/health/healthTypes";

export default function HealthFlowScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation(["mobile", "common", "medical"]);
  const params = useLocalSearchParams<{
    personId?: string;
    name?: string;
    intakeId?: string;
    declarationContext?: string;
  }>();

  const personId = params.personId || "";
  const childName = params.name || t("mobile:health.defaultChild", { defaultValue: "Mon enfant" });
  const intakeId = params.intakeId || null;
  const initialDuringMeal = params.declarationContext === "during_meal" || Boolean(intakeId);

  const [step, setStep] = useState<number>(1);
  const [catalog, setCatalog] = useState<MobileSymptomItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [durationKey, setDurationKey] = useState<string>("less_than_24h");
  const [tempCelsius, setTempCelsius] = useState<string>("");
  const [stoolsPerDay, setStoolsPerDay] = useState<string>("");
  const [vomitPerDay, setVomitPerDay] = useState<string>("");
  const [hasBlood, setHasBlood] = useState<boolean>(false);
  const [duringMeal, setDuringMeal] = useState<boolean>(initialDuringMeal);
  const [notes, setNotes] = useState<string>("");
  const [submissionResult, setSubmissionResult] = useState<MobileHealthEventOut | null>(null);

  useEffect(() => {
    fetchSymptomCatalog()
      .then((items) => {
        setCatalog(items);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const currentSymptom = catalog.find((c) => c.code === selectedCode);
  const isDangerSign = currentSymptom?.is_danger_sign || false;

  const handleSubmit = async () => {
    if (!selectedCode) return;
    setSubmitting(true);
    try {
      const durationDays = durationKey === "1_to_3_days" ? 2 : durationKey === "4_to_13_days" ? 7 : durationKey === "14_days_or_more" ? 15 : 1;
      const res = await submitHealthEvent({
        person_id: personId,
        intake_id: intakeId,
        declaration_context: duringMeal ? "during_meal" : "standalone",
        meal_interrupted: duringMeal,
        symptom_code: selectedCode,
        duration: durationKey,
        duration_days: durationDays,
        temperature_celsius: tempCelsius ? parseFloat(tempCelsius) : undefined,
        stools_frequency_per_day: stoolsPerDay ? parseInt(stoolsPerDay, 10) : undefined,
        vomiting_frequency_per_day: vomitPerDay ? parseInt(vomitPerDay, 10) : undefined,
        has_blood_stools: hasBlood,
        comment: notes.trim() || undefined,
      });
      setSubmissionResult(res);
      setStep(5);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <AppBar
        title={`${t("mobile:health.reportTitle", { defaultValue: "Santé" })} · ${childName}`}
        onBack={() => {
          if (step > 1 && step < 5) setStep(step - 1);
          else router.replace({ pathname: "/u-health-hub" as never, params: { personId, name: childName } });
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step indicator */}
        <View style={styles.stepIndicatorRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              style={[
                styles.stepDot,
                step >= s && styles.stepDotActive,
                step === s && styles.stepDotCurrent,
              ]}
            />
          ))}
        </View>

        {/* Immediate Danger Sign Warning */}
        {step < 5 && isDangerSign && (
          <View testID="mobile-immediate-danger-banner" style={styles.dangerBanner}>
            <FontAwesome5 name="exclamation-triangle" size={24} color="#991B1B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerBannerTitle}>
                {t("mobile:health.vitalDangerTitle", { defaultValue: "URGENCE VITALE : SIGNE DE DANGER" })}
              </Text>
              <Text style={styles.dangerBannerDesc}>
                {t("mobile:health.vitalDangerMsg", {
                  defaultValue: "Ce signe nécessite une prise en charge médicale urgente. Rendez-vous immédiatement dans la formation sanitaire ou l'hôpital le plus proche.",
                })}
              </Text>
            </View>
          </View>
        )}

        {step === 1 && (
          <Step1SymptomChoice
            catalog={catalog}
            selectedCode={selectedCode}
            loading={loading}
            onSelectCode={setSelectedCode}
            onContinue={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2DurationDetails
            selectedCode={selectedCode}
            durationKey={durationKey}
            tempCelsius={tempCelsius}
            stoolsPerDay={stoolsPerDay}
            vomitPerDay={vomitPerDay}
            hasBlood={hasBlood}
            onSelectDuration={setDurationKey}
            setTempCelsius={setTempCelsius}
            setStoolsPerDay={setStoolsPerDay}
            setVomitPerDay={setVomitPerDay}
            setHasBlood={setHasBlood}
            onContinue={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <Step3Context
            duringMeal={duringMeal}
            notes={notes}
            setDuringMeal={setDuringMeal}
            setNotes={setNotes}
            onContinue={() => setStep(4)}
          />
        )}

        {step === 4 && (
          <Step4Summary
            currentSymptom={currentSymptom}
            durationKey={durationKey}
            duringMeal={duringMeal}
            notes={notes}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        )}

        {step === 5 && (
          <Step5Guidance
            submissionResult={submissionResult}
            onFinish={() =>
              router.replace({
                pathname: "/u-health-hub" as never,
                params: { personId, name: childName },
              })
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
