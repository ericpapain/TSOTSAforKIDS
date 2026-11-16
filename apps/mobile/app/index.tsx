import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { View } from "react-native";

import { clearProfessionalSessionOnLaunch } from "../src/api/storage";

export default function Index(): React.JSX.Element {
  const router = useRouter();

  useEffect(() => {
    async function init(): Promise<void> {
      await clearProfessionalSessionOnLaunch();
      router.replace("/u-welcome");
    }
    void init();
  }, [router]);

  return <View style={{ flex: 1 }} />;
}
