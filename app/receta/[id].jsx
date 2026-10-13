import React, { useEffect, useState } from "react";

import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

import { supabase } from "../../lib/supabase";

const DetalleReceta = () => {
  const { id } = useLocalSearchParams();

  const [receta, setReceta] = useState(null);
  const [ingredientes, setIngredientes] = useState([]);
  const [faltantes, setFaltantes] = useState([]);
  const [idUsuario, setIdUsuario] = useState(null);
  const [calculando, setCalculando] = useState(true);
  const [alergenosUsuario, setAlergenosUsuario] = useState([]);
  const [tieneAlergenos, setTieneAlergenos] = useState([]);

  useEffect(() => {
    obtenerUsuario();
    obtenerReceta();
    obtenerIngredientes();
  }, []);

  useEffect(() => {
    if (idUsuario && ingredientes.length > 0) {
      calcularFaltantes();
      verificarAlergenos();
    }
  }, [idUsuario, ingredientes]);

  const obtenerUsuario = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("Usuarios")
      .select("id_usuario, alergenos")
      .eq("auth_id", user.id)
      .single();

    if (error) {
      console.log("Error obteniendo usuario:", error);
      return;
    }

    setIdUsuario(data.id_usuario);

    const lista =
      data.alergenos
        ?.split(",")
        .map((a) => a.trim().toLowerCase())
        .filter((a) => a.length > 0) || [];

    setAlergenosUsuario(lista);
  };

  const verificarAlergenos = () => {
    const encontrados = ingredientes.filter((item) =>
      alergenosUsuario.includes(
        item.Ingredientes?.nombre.toLowerCase()
      )
    );

    setTieneAlergenos(encontrados);
  };

  const obtenerReceta = async () => {
    const { data, error } = await supabase
      .from("Recetas")
      .select("*")
      .eq("id_receta", id)
      .single();

    if (error) {
      console.log(error);
      return;
    }

    setReceta(data);
  };

  const obtenerIngredientes = async () => {
    const { data, error } = await supabase
      .from("Receta_ingrediente")
      .select(`
        cantidad,
        unidad,
        Ingredientes (
          nombre
        )
      `)
      .eq("id_receta", id);

    if (error) {
      console.log(error);
      return;
    }

    setIngredientes(data || []);
  };

const calcularFaltantes = async () => {
  setCalculando(true);

  const { data: despensa } = await supabase
    .from("Despensa_usuario")
    .select("id_ingrediente")
    .eq("id_usuario", idUsuario);

  const ingredientesUsuario =
    despensa?.map((item) => item.id_ingrediente) || [];

  const { data: ingredientesReceta } = await supabase
    .from("Receta_ingrediente")
    .select(`
      id_ingrediente,
      Ingredientes(nombre)
    `)
    .eq("id_receta", id);

  const faltan =
    ingredientesReceta?.filter(
      (item) =>
        !ingredientesUsuario.includes(
          item.id_ingrediente
        )
    ) || [];

  setFaltantes(faltan);
  setCalculando(false);
};

  if (!receta) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>
        <Image
          source={{ uri: receta.imagen_url }}
          style={styles.imagen}
        />

        <Text style={styles.nombre}>
          {receta.nombre}
        </Text>

        <Text style={styles.descripcion}>
          {receta.descripcion}
        </Text>

        {tieneAlergenos.length > 0 && (
          <View style={styles.alertaAlergia}>
            <Text style={styles.alertaTitulo}>
              ⚠️ Atención
            </Text>

            <Text style={styles.alertaTexto}>
              Esta receta contiene:
            </Text>

            {tieneAlergenos.map((item, index) => (
              <Text key={index} style={styles.alertaIngrediente}>
                • {item.Ingredientes?.nombre}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.titulo}>
          Ingredientes faltantes
        </Text>

       {calculando ? (
      <Text style={styles.calculando}>
        🔍 Revisando tu despensa...
      </Text>
      ) : faltantes.length === 0 ? (
      <Text style={styles.completo}>
        ✅ Tienes todos los ingredientes
      </Text>
      ) : (
      faltantes.map((item, index) => (
      <View
        key={index}
        style={styles.faltante}
      >
      <Text>
        ❌ {item.Ingredientes?.nombre}
      </Text>
    </View>
  ))
)}

        <Text style={styles.titulo}>
          Ingredientes
        </Text>

        {ingredientes.map((item, index) => (
          <View
            key={index}
            style={styles.ingrediente}
          >
            <Text style={styles.ingredienteTexto}>
              • {item.Ingredientes?.nombre}
            </Text>

            <Text style={styles.cantidad}>
              {item.cantidad} {item.unidad}
            </Text>
          </View>
        ))}

        <Text style={styles.titulo}>
          Preparación
        </Text>

        {receta.instrucciones?.map((paso, index) => (
          <View
            key={index}
            style={styles.paso}
          >
            <Text style={styles.numero}>
              Paso {paso.paso || index + 1}
            </Text>

            <Text style={styles.textoPaso}>
              {paso.descripcion}
            </Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default DetalleReceta;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FAF7F0",
  },

  container: {
    flex: 1,
  },

  imagen: {
    width: "100%",
    height: 280,
    backgroundColor: "#DDD",
  },

  nombre: {
    fontSize: 32,
    fontWeight: "900",
    color: "#222",
    paddingHorizontal: 20,
    marginTop: 20,
  },

  descripcion: {
    paddingHorizontal: 20,
    marginTop: 10,
    color: "#666",
    lineHeight: 24,
    fontSize: 16,
  },

  titulo: {
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 14,
    fontSize: 24,
    fontWeight: "900",
    color: "#222",
  },

  ingrediente: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEE7DD",
  },

  ingredienteTexto: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  cantidad: {
    marginTop: 4,
    color: "#E35336",
    fontWeight: "800",
  },

  faltante: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: "#FFF4F4",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFD1D1",
  },

  completo: {
    marginHorizontal: 20,
    color: "#2F7D32",
    fontWeight: "700",
    fontSize: 16,
  },

  paso: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEE7DD",
  },

  numero: {
    fontSize: 15,
    fontWeight: "900",
    color: "#E35336",
    marginBottom: 8,
  },

  textoPaso: {
    color: "#444",
    lineHeight: 24,
    fontSize: 16,
  },

  calculando: {
    marginHorizontal: 20,
    color: "#666",
    fontSize: 16,
    fontStyle: "italic",
  },
  
  alertaAlergia: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFF3CD",
    borderWidth: 1,
    borderColor: "#F5C542",
  },

  alertaTitulo: {
    fontSize: 18,
    fontWeight: "900",
    color: "#A15C00",
  },

  alertaTexto: {
    marginTop: 6,
    color: "#7A5200",
  },

  alertaIngrediente: {
    marginTop: 4,
    fontWeight: "700",
    color: "#7A5200",
  },
});