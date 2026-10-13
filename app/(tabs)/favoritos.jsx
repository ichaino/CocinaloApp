import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
// 🌟 IMPORTADO: Importamos useRouter para controlar la navegación
import { useRouter } from "expo-router";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity, // 🌟 AÑADIDO: Para hacer las tarjetas cliqueables
} from "react-native";

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "../../lib/supabase";

export default function Favoritos() {
  const insets = useSafeAreaInsets();
  // 🌟 INICIALIZADO: El router para cambiar de pantalla
  const router = useRouter();

  const [favoritos, setFavoritos] = useState([]);
  const [idUsuario, setIdUsuario] = useState(null);
  //const idUsuario = 1;

  useEffect(() => {
    obtenerUsuario();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (idUsuario) {
        obtenerFavoritos();
      }
    }, [idUsuario])
  );

  const obtenerUsuario = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("Usuarios")
      .select("id_usuario")
      .eq("auth_id", user.id)
      .single();

    if (error) {
      console.log("Error obteniendo usuario:", error);
      return;
    }

    console.log("Usuario encontrado:", data);

    setIdUsuario(data.id_usuario);
  };

  const obtenerFavoritos = async () => {
    const { data, error } = await supabase
      .from("favoritos")
      .select(`
        id_fav,
        Recetas (
          id_receta,
          nombre,
          descripcion,
          imagen_url
        )
      `)
      .eq("id_usuario", idUsuario);

    console.log("DATA FAVORITOS:", data);
    console.log("ERROR FAVORITOS:", error);

    if (error) {
      console.log(error);
      return;
    }

    setFavoritos(data || []);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: Math.max(80, insets.bottom + 72),
        }}
      >
        <Text style={styles.title}>
          Favoritos
        </Text>

        {favoritos.length === 0 ? (
          <View style={styles.vacioContenedor}>
            <Text style={styles.vacioTitulo}>Aún no tienes favoritos ❤️</Text>

            <Text style={styles.vacioTexto}>
              Explora las recetas y presiona el corazón para guardarlas aquí.
            </Text>
          </View>
        ) : (
          favoritos.map((fav) => (
            <TouchableOpacity
              key={fav.id_fav}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => {
                if (fav.Recetas?.id_receta) {
                  router.push({
                    pathname: "/receta/[id]",
                    params: { id: fav.Recetas.id_receta },
                  });
                }
              }}
            >
              <Image
                source={{ uri: fav.Recetas?.imagen_url }}
                style={styles.imagen}
              />

              <View style={styles.info}>
                <Text style={styles.nombre}>
                  {fav.Recetas?.nombre}
                </Text>

                <Text style={styles.descripcion}>
                  {fav.Recetas?.descripcion}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FAF7F0",
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    marginVertical: 20,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#EEE7DD",
  },

  imagen: {
    width: "100%",
    height: 200,
  },

  info: {
    padding: 16,
  },

  nombre: {
    fontSize: 22,
    fontWeight: "900",
    color: "#222",
  },

  descripcion: {
    marginTop: 8,
    color: "#666",
    lineHeight: 22,
  },
  
  vacioContenedor: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EEE7DD",
    marginTop: 20,
  },

  vacioTitulo: {
    fontSize: 18,
    fontWeight: "900",
    color: "#222",
  },

  vacioTexto: {
    marginTop: 8,
    color: "#666",
    lineHeight: 22,
    fontSize: 15,
  },


});