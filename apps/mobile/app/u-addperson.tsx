import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBar } from "../src/components/AppBar";
import { addPersonStyles as styles } from "../src/features/persons/addPersonStyles";
import { createFamilyMember } from "../src/features/persons/personsService";
import type { RelationType, SexType } from "../src/features/persons/types";
import { colors } from "../src/theme/colors";

export default function AddPersonScreen(): React.JSX.Element {
  const router = useRouter();
  const [relation, setRelation] = useState<RelationType>("child");
  const [firstName, setFirstName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState<SexType>("F");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [muac, setMuac] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleSex = (): void => {
    setSex((prev) => (prev === "F" ? "M" : "F"));
  };

  const handleContinue = async (): Promise<void> => {
    if (!firstName.trim()) {
      setErrorMessage("Veuillez saisir un prénom.");
      return;
    }
    if (!birthDate.trim()) {
      setErrorMessage("Veuillez saisir une date de naissance.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await createFamilyMember({
        first_name: firstName,
        birth_date: birthDate,
        sex,
        relation,
        weight,
        height,
        mid_upper_arm_circumference: muac,
      });

      if (res.data?.id) {
        router.push({
          pathname: "/u-consent",
          params: { personId: res.data.id, name: firstName.trim() },
        });
      } else {
        // Fallback for offline or test mode
        router.push({
          pathname: "/u-consent",
          params: { personId: "new-person", name: firstName.trim() },
        });
      }
    } catch {
      setErrorMessage("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <AppBar
        title="Ajouter une personne"
        onBack={() => router.replace("/u-persons")}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Relation selector: Qui ? */}
        <Text style={styles.sectionTitle}>Qui ?</Text>
        <View style={styles.relationRow}>
          <Pressable
            testID="btn-relation-self"
            style={[
              styles.relationButton,
              relation === "self" ? styles.relationActive : styles.relationInactive,
            ]}
            onPress={() => setRelation("self")}
          >
            <Text
              style={[
                styles.relationText,
                relation === "self" ? styles.relationTextActive : styles.relationTextInactive,
              ]}
            >
              Moi-même
            </Text>
          </Pressable>

          <Pressable
            testID="btn-relation-child"
            style={[
              styles.relationButton,
              relation === "child" ? styles.relationActive : styles.relationInactive,
            ]}
            onPress={() => setRelation("child")}
          >
            <Text
              style={[
                styles.relationText,
                relation === "child" ? styles.relationTextActive : styles.relationTextInactive,
              ]}
            >
              Un enfant
            </Text>
          </Pressable>

          <Pressable
            testID="btn-relation-relative"
            style={[
              styles.relationButton,
              relation === "relative" ? styles.relationActive : styles.relationInactive,
            ]}
            onPress={() => setRelation("relative")}
          >
            <Text
              style={[
                styles.relationText,
                relation === "relative" ? styles.relationTextActive : styles.relationTextInactive,
              ]}
            >
              Un proche
            </Text>
          </Pressable>
        </View>

        {errorMessage && (
          <Text testID="addperson-error-text" style={styles.errorText}>
            {errorMessage}
          </Text>
        )}

        {/* First name field */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Prénom</Text>
          <View style={styles.inputContainer}>
            <TextInput
              testID="input-first-name"
              style={styles.input}
              value={firstName}
              onChangeText={(t) => {
                setFirstName(t);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Amina"
              placeholderTextColor={colors.textSubtle}
            />
          </View>
        </View>

        {/* Date of birth & Sex */}
        <View style={styles.twoColRow}>
          <View style={styles.colLeft}>
            <Text style={styles.fieldLabel}>Date de naissance</Text>
            <View style={styles.inputContainer}>
              <TextInput
                testID="input-birth-date"
                style={styles.input}
                value={birthDate}
                onChangeText={(t) => {
                  setBirthDate(t);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="12/12/2024"
                placeholderTextColor={colors.textSubtle}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          <View style={styles.colRight}>
            <Text style={styles.fieldLabel}>Sexe</Text>
            <Pressable
              testID="btn-toggle-sex"
              style={styles.selectContainer}
              onPress={toggleSex}
            >
              <Text style={styles.selectText}>
                {sex === "F" ? "Fille ▾" : "Garçon ▾"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Weight & Height */}
        <View style={styles.twoColRow}>
          <View style={styles.colHalf}>
            <Text style={styles.fieldLabel}>Poids</Text>
            <View style={styles.inputContainer}>
              <TextInput
                testID="input-weight"
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="7,0 kg"
                placeholderTextColor={colors.textSubtle}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.colHalf}>
            <Text style={styles.fieldLabel}>
              {relation === "child" ? "Taille (couchée)" : "Taille (debout)"}
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                testID="input-height"
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder="76,0 cm"
                placeholderTextColor={colors.textSubtle}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* MUAC */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Périmètre brachial (facultatif)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              testID="input-muac"
              style={styles.input}
              value={muac}
              onChangeText={setMuac}
              placeholder="112 mm"
              placeholderTextColor={colors.textSubtle}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Info note */}
        <Text style={styles.noteText}>
          Pas de compte à créer : la personne est suivie depuis le vôtre.
        </Text>

        {/* Continue button */}
        <Pressable
          testID="btn-addperson-continue"
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.pressed,
          ]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.continueButtonText}>Continuer</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
