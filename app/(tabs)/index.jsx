import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";

import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "../../lib/supabase";

const Home = () => {
  const insets = useSafeAreaInsets();
  const [recetas, setRecetas] = useState([]);
  const [despensa, setDespensa] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const { session, loading } = useAuth();
  const [idUsuario, setIdUsuario] = useState(null);

  //const idUsuario = 1;

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/login");
    }
  }, [session, loading]);

  useEffect(() => {
    obtenerRecetas();
  }, []);

  useEffect(() => {
    if (!idUsuario) return;

    obtenerDespensa();
    obtenerFavoritos();
  }, [idUsuario]);

  useEffect(() => {
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
        console.log(error);
        return;
      }

      console.log("Usuario encontrado:", data);

      setIdUsuario(data.id_usuario);
    };

    obtenerUsuario();
  }, []);

  useEffect(() => {
    if (!idUsuario) return;

    obtenerDespensa();
    obtenerFavoritos();
    obtenerRecetas();
  }, [idUsuario]);

  const obtenerDespensa = async () => {
    const { data } = await supabase
      .from("Despensa_usuario")
      .select("id_ingrediente")
      .eq("id_usuario", idUsuario);

    setDespensa(data || []);
  };

  const obtenerRecetas = async () => {
    const { data, error } = await supabase
      .from("Recetas")
      .select("*");

    if (error) {
      console.log(error);
      return;
    }

    setRecetas(data);
  };

  const obtenerFavoritos = async () => {
    const { data, error } = await supabase
      .from("favoritos")
      .select("id_receta")
      .eq("id_usuario", idUsuario);

    if (error) {
      console.log("Error al obtener favoritos:", error);
      return;
    }

    setFavoritos(data || []);
  };

  const toggleFavorito = async (idReceta) => {
    const esFavorito = favoritos.some(
      (fav) => Number(fav.id_receta) === Number(idReceta)
    );

    if (esFavorito) {
      const { error } = await supabase
        .from("favoritos")
        .delete()
        .eq("id_usuario", idUsuario)
        .eq("id_receta", idReceta);

      if (error) {
        console.log("Error al eliminar favorito:", error);
        Alert.alert("Error", error.message || "No se pudo quitar de favoritos");
        return;
      }

      setFavoritos(
        favoritos.filter((fav) => Number(fav.id_receta) !== Number(idReceta))
      );
    } else {
      const { error } = await supabase
        .from("favoritos")
        .insert([
          {
            id_usuario: idUsuario,
            id_receta: idReceta,
          },
        ]);

      if (error) {
        console.log("Error al guardar favorito:", error);
        Alert.alert("Error", error.message || "No se pudo guardar en favoritos");
        return;
      }

      setFavoritos([...favoritos, { id_receta: idReceta }]);
    }
  };

  const renderReceta = ({ item }) => {
    const esFavorito = favoritos.some(
      (fav) => Number(fav.id_receta) === Number(item.id_receta)
    );

    return (
      <Pressable
        style={styles.card}
        onPress={() => router.push(`/receta/${item.id_receta}`)}
      >
        <Image source={{ uri: item.imagen_url }} style={styles.imagen} />

        <View style={styles.info}>
          <View style={styles.cardHeader}>
            <Text style={styles.nombre}>{item.nombre}</Text>

            <Pressable
              onPress={(event) => {
                event.stopPropagation(); // Evita que al dar clic al corazón se abra la receta
                toggleFavorito(item.id_receta);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={styles.corazon}>{esFavorito ? "♥" : "♡"}</Text>
            </Pressable>
          </View>

          <Text style={styles.descripcion}>{item.descripcion}</Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return null;
  }

  if (!session) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: Math.max(80, insets.bottom + 72),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.logo}>CocinaLO!</Text>

          </View>

          <Text style={styles.subtitulo}>
            Recetas basadas en los ingredientes de tu despensa
          </Text>
        </View>

        <View style={styles.topBar}>
          <View>
            <Text style={styles.titulo}>Recetas para ti</Text>

            <Text style={styles.textoCantidad}>
              {recetas.length} recetas disponibles
            </Text>
          </View>

          <TouchableOpacity
            style={styles.boton}
            onPress={() => router.push("/despensa")}
          >
            <Text style={styles.botonTexto}>Mi despensa</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={recetas}
          keyExtractor={(item) => item.id_receta.toString()}
          renderItem={renderReceta}
          scrollEnabled={false}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  loginBoton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E8E2D8",
  },

  loginTexto: {
    color: "#222",
    fontWeight: "900",
  },

  safe: {
    flex: 1,
    backgroundColor: "#FAF7F0",
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  header: {
    paddingTop: 10,
    paddingBottom: 20,
  },

  logo: {
    fontSize: 40,
    fontWeight: "900",
    color: "#222",
  },

  subtitulo: {
    marginTop: 8,
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  titulo: {
    fontSize: 30,
    fontWeight: "900",
    color: "#222",
    marginRight: 12,
  },

  textoCantidad: {
    marginTop: 4,
    color: "#777",
  },

  boton: {
    backgroundColor: "#2F7D32",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },

  botonTexto: {
    color: "#FFF",
    fontWeight: "900",
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
    height: 210,
    backgroundColor: "#DDD",
  },

  info: {
    padding: 16,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  nombre: {
    fontSize: 22,
    fontWeight: "900",
    color: "#222",
    flex: 1, // Evita que nombres muy largos empujen el corazón fuera de la pantalla
    marginRight: 8,
  },

  corazon: {
    fontSize: 24,
  },

  descripcion: {
    marginTop: 8,
    color: "#666",
    lineHeight: 22,
  },
});