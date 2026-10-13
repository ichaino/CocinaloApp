import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { supabase } from "../lib/supabase";
import * as Linking from "expo-linking";
import { router } from "expo-router";

export default function ResetPassword() {
  const [password, setPassword] = useState("");

  useEffect(() => {
    const handleUrl = async (event) => {
      const url = event.url;

      // Supabase manda el access_token en el link
      const parsed = Linking.parse(url);

      const access_token = parsed.queryParams?.access_token;
      const refresh_token = parsed.queryParams?.refresh_token;

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          Alert.alert("Error", error.message);
        }
      }
    };

    const subscription = Linking.addEventListener("url", handleUrl);

    return () => subscription.remove();
  }, []);

  const actualizarPassword = async () => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert("Listo", "Contraseña actualizada");
    router.replace("/login");
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        Nueva contraseña
      </Text>

      <TextInput
        placeholder="Nueva contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          borderWidth: 1,
          padding: 12,
          marginTop: 20,
          borderRadius: 10,
        }}
      />

      <TouchableOpacity
        onPress={actualizarPassword}
        style={{
          backgroundColor: "#2F7D32",
          padding: 15,
          marginTop: 20,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>
          Cambiar contraseña
        </Text>
      </TouchableOpacity>
    </View>
  );
}