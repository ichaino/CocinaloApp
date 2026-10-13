import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Perfil() {
  const ALERGIAS = [
    "Gluten",
    "Lactosa",
    "Huevo",
    "Maní",
    "Frutos secos",
    "Mariscos",
    "Pescado",
    "Soya",
    "Sésamo",
  ];

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("");
  const [alergenos, setAlergenos] = useState([]);

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) return;

      const { data, error } = await supabase
        .from("Usuarios")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      if (error) {
        console.log(error.message);
        return;
      }

      setPerfil(data);
      setEdad(data.edad?.toString() || "");
      setSexo(data.sexo || "");
      setAlergenos(
        data.alergenos
          ? data.alergenos.split(",")
          : []
      );
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const guardarCambios = async () => {
    try {
      const { error } = await supabase
        .from("Usuarios")
        .update({
          edad: edad ? parseInt(edad) : null,
          sexo,
          alergenos: alergenos.join(","),
        })
        .eq("auth_id", perfil.auth_id);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      Alert.alert("Éxito", "Perfil actualizado 🍃");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "No se pudo actualizar");
    }
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF7F0" }}>
      <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🌿 Mi Perfil</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nombre</Text>
        <Text style={styles.value}>{perfil?.nombres}</Text>

        <Text style={styles.label}>Correo</Text>
        <Text style={styles.value}>{perfil?.correo}</Text>

        <Text style={styles.label}>Edad</Text>
        <TextInput
          style={styles.input}
          value={edad}
          onChangeText={setEdad}
          keyboardType="numeric"
          placeholder="Ingresa tu edad"
        />

        <View style={styles.selectorContainer}>
          <Text style={styles.label}>Sexo</Text>

          <View style={styles.selectorRow}>
            <TouchableOpacity
              style={[
                styles.selectorButton,
                sexo === "Masculino" && styles.selectorActive,
              ]}
              onPress={() => setSexo("Masculino")}
            >
              <Text
                style={[
                  styles.selectorText,
                  sexo === "Masculino" && styles.selectorTextActive,
                ]}
              >
                Masculino
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.selectorButton,
                sexo === "Femenino" && styles.selectorActive,
              ]}
              onPress={() => setSexo("Femenino")}
            >
              <Text
                style={[
                  styles.selectorText,
                  sexo === "Femenino" && styles.selectorTextActive,
                ]}
              >
                Femenino
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.selectorButton,
                sexo === "Otro" && styles.selectorActive,
              ]}
              onPress={() => setSexo("Otro")}
            >
              <Text
                style={[
                  styles.selectorText,
                  sexo === "Otro" && styles.selectorTextActive,
                ]}
              >
                Otro
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>Alergias</Text>
        <View style={styles.alergiasContainer}>
          {ALERGIAS.map((item) => {
            const seleccionada = alergenos.includes(item);

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.alergiaChip,
                  seleccionada && styles.alergiaChipActiva,
                ]}
                onPress={() => {
                  if (seleccionada) {
                    setAlergenos(alergenos.filter(a => a !== item));
                  } else {
                    setAlergenos([...alergenos, item]);
                  }
                }}
              >
                <Text
                  style={[
                    styles.alergiaTexto,
                    seleccionada && styles.alergiaTextoActivo,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={guardarCambios}
        >
          <Text style={styles.saveText}>Guardar cambios</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={cerrarSesion}
      >
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#FAF7F0",
    padding: 20,
    paddingBottom: 60, // 👈 IMPORTANTE
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#2F7D32",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 4,
  },

  label: {
    fontSize: 14,
    color: "#777",
    marginTop: 15,
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginTop: 5,
    backgroundColor: "#FAFAFA",
  },

  saveButton: {
    backgroundColor: "#2F7D32",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },

  saveText: {
    color: "#fff",
    fontWeight: "bold",
  },

  logoutButton: {
    marginTop: 20,
    backgroundColor: "#D9534F",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },
  selectorContainer: {
  marginTop: 15,
  },

  selectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  selectorButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginHorizontal: 3,
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },

  selectorActive: {
    backgroundColor: "#2F7D32",
    borderColor: "#2F7D32",
  },

  selectorText: {
    color: "#333",
    fontWeight: "500",
  },

  selectorTextActive: {
    color: "#fff",
  },

  alergiasContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  marginTop: 10,
  },

  alergiaChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FAFAFA",
    marginRight: 8,
    marginBottom: 8,
  },

  alergiaChipActiva: {
    backgroundColor: "#2F7D32",
    borderColor: "#2F7D32",
  },

  alergiaTexto: {
    color: "#333",
    fontWeight: "600",
  },

  alergiaTextoActivo: {
    color: "#FFF",
  },
});