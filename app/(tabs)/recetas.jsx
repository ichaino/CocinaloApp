import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator 
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function Recetas() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [recetasViables, setRecetasViables] = useState([]);
  const [idUsuario, setIdUsuario] = useState(null);

  useEffect(() => {
    obtenerUsuario();
  }, []);

  useEffect(() => {
    if (idUsuario) {
      cargarRecetasDisponibles();
    }
  }, [idUsuario]);

  const obtenerUsuario = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("Usuarios")
      .select("id_usuario")
      .eq("auth_id", user.id)
      .single();

    if (error) {
      console.log("Error obteniendo usuario en recetas.jsx:", error);
      setLoading(false);
      return;
    }

    setIdUsuario(data.id_usuario);
  };

  const cargarRecetasDisponibles = async () => {
    try {
      setLoading(true);

      // 1. Obtener lo que el usuario tiene en su despensa (siguiendo tu lógica de [id].jsx)
      const { data: despensa } = await supabase
        .from("Despensa_usuario")
        .select("id_ingrediente")
        .eq("id_usuario", idUsuario);

      const ingredientesUsuario = despensa?.map((item) => item.id_ingrediente) || [];

      // 2. Traer todas las recetas junto con sus ingredientes requeridos
      const { data: todasLasRecetas, error: recetaError } = await supabase
        .from("Recetas")
        .select(`
          id_receta,
          nombre,
          descripcion,
          imagen_url
        `);

      if (recetaError) throw recetaError;

      // 3. Traer los mapeos de ingredientes de todas las recetas
      const { data: relacionesIngredientes, error: relError } = await supabase
        .from("Receta_ingrediente")
        .select("id_receta, id_ingrediente");

      if (relError) throw relError;

      // 4. Filtrar cuáles recetas se pueden hacer por completo
      const viables = todasLasRecetas.filter((receta) => {
        // Obtenemos los ingredientes que requiere específicamente ESTA receta
        const requeridos = relacionesIngredientes.filter(
          (rel) => rel.id_receta === receta.id_receta
        );

        // Si la receta no tiene ingredientes registrados, no la listamos
        if (requeridos.length === 0) return false;

        // Verificamos si el usuario tiene CADA UNO de los ingredientes requeridos
        const tieneTodo = requeridos.every((req) =>
          ingredientesUsuario.includes(req.id_ingrediente)
        );

        return tieneTodo;
      });

      setRecetasViables(viables);
    } catch (error) {
      console.log("Error al filtrar recetas viables:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderReceta = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/receta/${item.id_receta}`)}
    >
      <Image source={{ uri: item.imagen_url }} style={styles.imagen} />
      
      <View style={styles.info}>
        <Text style={styles.nombreReceta}>{item.nombre}</Text>
        <Text style={styles.descripcionReceta} numberOfLines={2}>
          {item.descripcion}
        </Text>
        
        <View style={styles.tagMatch}>
          <Text style={styles.tagMatchTexto}>✨ Listo para cocinar</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingVertical: 24,
          paddingBottom: Math.max(80, insets.bottom + 72),
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Recetas disponibles</Text>
        <Text style={styles.subtitle}>
          Platos que puedes preparar ahora mismo con lo que tienes en casa.
        </Text>

        {loading ? (
          <View style={styles.centro}>
            <ActivityIndicator size="large" color="#2F7D32" />
            <Text style={styles.textCargando}>Revisando tu despensa...</Text>
          </View>
        ) : recetasViables.length === 0 ? (
          <View style={styles.vacioContenedor}>
            <Text style={styles.vacioTitulo}>Despensa incompleta 🍳</Text>
            <Text style={styles.vacioTexto}>
              No tienes los ingredientes suficientes para completar ninguna receta de tu catálogo. ¡Prueba añadiendo más insumos a tu despensa!
            </Text>
          </View>
        ) : (
          <FlatList
            data={recetasViables}
            keyExtractor={(item) => item.id_receta.toString()}
            renderItem={renderReceta}
            scrollEnabled={false}
          />
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
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#222",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
    marginBottom: 24,
  },
  centro: {
    marginTop: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  textCargando: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
    fontStyle: "italic",
  },
  vacioContenedor: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EEE7DD",
    marginTop: 10,
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
    height: 190,
    backgroundColor: "#DDD",
  },
  info: {
    padding: 16,
  },
  nombreReceta: {
    fontSize: 22,
    fontWeight: "900",
    color: "#222",
  },
  descripcionReceta: {
    marginTop: 6,
    color: "#666",
    fontSize: 15,
    lineHeight: 22,
  },
  tagMatch: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  tagMatchTexto: {
    color: "#2F7D32",
    fontSize: 13,
    fontWeight: "800",
  },
});