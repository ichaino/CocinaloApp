import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "../../lib/supabase";

const Home = () => {
  // 🔥 IMPORTADO DEL SEGUNDO CÓDIGO: Manejo de áreas seguras del dispositivo
  const insets = useSafeAreaInsets();

  const [ingredientes, setIngredientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [unidad, setUnidad] = useState("unidad");
  const [ingredienteSeleccionado, setIngredienteSeleccionado] = useState(null);
  const [despensa, setDespensa] = useState([]);
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const scrollRef = useRef(null);

  // Editar despensa con cantidad 
  const [editandoItem, setEditandoItem] = useState(null);
  const [cantidadEditada, setCantidadEditada] = useState("");
  const [unidadEditada, setUnidadEditada] = useState("");

  // 🛡️ CONSERVADO DEL CÓDIGO ORIGINAL: Autenticación dinámica de Supabase
  const [user, setUser] = useState(null);
  const [idUsuario, setIdUsuario] = useState(null);

  // Obtener estado de autenticación de Supabase al montar el componente
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };
    getUser();
  }, []);

  // Mapear el auth_id del usuario con su respectivo id_usuario en la base de datos
  useEffect(() => {
    const fetchUsuario = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("Usuarios")
        .select("id_usuario")
        .eq("auth_id", user.id)
        .single();

      if (error) {
        console.log("Error buscando usuario:", error);
        return;
      }

      console.log("Usuario encontrado:", data);
      setIdUsuario(data.id_usuario);
    };

    fetchUsuario();
  }, [user]);

  // Cargar datos del usuario una vez que el idUsuario real esté listo
  useEffect(() => {
    if (!idUsuario) return;

    obtenerIngredientes();
    obtenerDespensa();
  }, [idUsuario]);

  const obtenerIngredientes = async () => {
    const { data, error } = await supabase
      .from("Ingredientes")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) {
      console.log("Error al obtener ingredientes:", error);
      Alert.alert("Error", "No se pudieron cargar los ingredientes");
      return;
    }

    setIngredientes(data);
  };

  const buscarIngredientes = async (texto) => {
    setBusqueda(texto);

    if (texto.trim() === "") {
      obtenerIngredientes();
      return;
    }

    const { data, error } = await supabase
      .from("Ingredientes")
      .select("*")
      .ilike("nombre", `%${texto}%`)
      .order("nombre", { ascending: true });

    if (error) {
      console.log("Error al buscar ingredientes:", error);
      return;
    }

    setIngredientes(data);
  };

  const obtenerDespensa = async () => { 
    if (!idUsuario) return;
    const { data, error } = await supabase
      .from("Despensa_usuario")
      .select(`
        id_despensa,
        id_usuario,
        cantidad,
        unidad,
        Ingredientes (
          id_ingrediente,
          nombre,
          tipo,
          imagen_url
        )
      `)
      .eq("id_usuario", idUsuario);

    if (error) {
      console.log("Error al obtener despensa:", error);
      return;
    }

    setDespensa(data);
  };

  const agregarADespensa = async () => {
    if (!idUsuario) {
      Alert.alert("Cargando usuario", "Espera un momento");
      return;
    }
    
    if (!ingredienteSeleccionado) {
      Alert.alert("Falta ingrediente", "Selecciona un ingrediente primero");
      return;
    }

    if (!cantidad || Number(cantidad) <= 0) {
      Alert.alert("Cantidad inválida", "Ingresa una cantidad mayor a 0");
      return;
    }

    const { data: existente, error: errorExiste } = await supabase
      .from("Despensa_usuario")
      .select("*")
      .eq("id_usuario", idUsuario)
      .eq("id_ingrediente", ingredienteSeleccionado.id_ingrediente);

    if (errorExiste) {
      console.log("Error revisando duplicado:", errorExiste);
      Alert.alert("Error", "No se pudo revisar la despensa");
      return;
    }

    if (existente.length > 0) {
      Alert.alert(
        "Ingrediente repetido",
        "Este ingrediente ya está en tu despensa"
      );
      return;
    }

    const { error } = await supabase.from("Despensa_usuario").insert([
      {
        id_usuario: idUsuario,
        id_ingrediente: ingredienteSeleccionado.id_ingrediente,
        cantidad: Number(cantidad),
        unidad: unidad,
      },
    ]);

    if (error) {
      console.log("Error al agregar a despensa:", error);
      Alert.alert("Error Supabase", error.message);
      return;
    }

    setCantidad("");
    setUnidad("unidad");
    setBusqueda("");
    setIngredienteSeleccionado(null);
    setMostrarAgregar(false);
    obtenerDespensa();

    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, 300);

    Alert.alert("Listo", "Ingrediente agregado a tu despensa");
  };

  const eliminarDeDespensa = async (idDespensa) => {
    Alert.alert(
      "Eliminar ingrediente",
      "¿Quieres eliminar este ingrediente de tu despensa?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("Despensa_usuario")
              .delete()
              .eq("id_despensa", idDespensa);

            if (error) {
              console.log("Error al eliminar:", error);
              Alert.alert("Error", "No se pudo eliminar el ingrediente");
              return;
            }

            obtenerDespensa();
          },
        },
      ]
    );
  };

  const abrirEditorDespensa = (item) => {
    setEditandoItem(item);
    setCantidadEditada(String(item.cantidad));
    setUnidadEditada(item.unidad);
  };

  const guardarCambiosDespensa = async () => {
    if (!editandoItem) return;

    if (!cantidadEditada || Number(cantidadEditada) <= 0) {
      Alert.alert("Cantidad inválida", "Ingresa una cantidad mayor a 0");
      return;
    }

    if (!unidadEditada.trim()) {
      Alert.alert("Unidad inválida", "Ingresa una unidad válida");
      return;
    }

    const { error } = await supabase
      .from("Despensa_usuario")
      .update({
        cantidad: Number(cantidadEditada),
        unidad: unidadEditada.trim(),
      })
      .eq("id_despensa", editandoItem.id_despensa);

    if (error) {
      console.log("Error al editar despensa:", error);
      Alert.alert("Error", "No se pudieron guardar los cambios");
      return;
    }

    setEditandoItem(null);
    setCantidadEditada("");
    setUnidadEditada("");
    obtenerDespensa();

    Alert.alert("Listo", "Ingrediente actualizado correctamente");
  };

  const renderIngrediente = ({ item }) => {
    const seleccionado = ingredienteSeleccionado?.id_ingrediente === item.id_ingrediente;

    return (
      <TouchableOpacity
        style={[styles.cardIngrediente, seleccionado && styles.cardSeleccionada]}
        onPress={() => {
          setIngredienteSeleccionado(item);
          setUnidad(item.unidad_base);

          setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
          }, 200);
        }}
      >
        <Image
          source={{ uri: item.imagen_url }}
          style={styles.imagenIngrediente}
        />

        <View style={styles.cardInfo}>
          <Text style={styles.nombreIngrediente}>{item.nombre}</Text>
          <Text style={styles.tipoIngrediente}>{item.tipo}</Text>
        </View>

        <View style={styles.botonMas}>
          <Text style={styles.mas}>+</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDespensaGrid = ({ item }) => (
    <TouchableOpacity
      style={styles.cardDespensaGrid}
      onPress={() => abrirEditorDespensa(item)}
      activeOpacity={0.8}
    >
      <TouchableOpacity
        style={styles.botonEliminar}
        onPress={() => eliminarDeDespensa(item.id_despensa)}
      >
        <Text style={styles.botonEliminarTexto}>×</Text>
      </TouchableOpacity>

      <Image
        source={{ uri: item.Ingredientes?.imagen_url }}
        style={styles.imagenDespensa}
      />

      <Text style={styles.nombreDespensaGrid} numberOfLines={1}>
        {item.Ingredientes?.nombre}
      </Text>

      <Text style={styles.cantidadDespensaGrid}>
        {item.cantidad} {item.unidad}
      </Text>

      <Text style={styles.editarTexto}>Tocar para editar</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          // 🔥 INTEGRADO DEL SEGUNDO CÓDIGO: Padding responsivo calculado con insets
          contentContainerStyle={[
            styles.scrollContent, 
            { paddingBottom: Math.max(80, insets.bottom + 72) }
          ]}
        >
          
          <View style={styles.header}>
            <Text style={styles.logo}>CocinaLO!</Text>
            <Text style={styles.descripcion}>
              Administra tu despensa y agrega solo los ingredientes que tienes en casa.
            </Text>
          </View>

          <View style={styles.seccionHeaderPrincipal}>
            <View>
              <Text style={styles.seccionTituloGrande}>Mi despensa</Text>
              <Text style={styles.seccionSubtitulo}>
                {despensa.length} ingredientes guardados
              </Text>
            </View>

            <TouchableOpacity
              style={styles.botonAbrirAgregar}
              onPress={() => {
                const nuevoEstado = !mostrarAgregar;
                setMostrarAgregar(nuevoEstado);

                if (nuevoEstado) {
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({ y: 420, animated: true });
                  }, 200);
                }
              }}
            >
              <Text style={styles.botonAbrirAgregarTexto}>
                {mostrarAgregar ? "Cerrar" : "+ Agregar"}
              </Text>
            </TouchableOpacity>
          </View>

          {despensa.length === 0 ? (
            <View style={styles.despensaVacia}>
              <Text style={styles.despensaVaciaTitulo}>
                Tu despensa está vacía
              </Text>
              <Text style={styles.despensaVaciaTexto}>
                Toca “Agregar” para buscar ingredientes y guardarlos con su cantidad.
              </Text>
            </View>
          ) : (
            <FlatList
              data={despensa}
              keyExtractor={(item) => item.id_despensa.toString()}
              renderItem={renderDespensaGrid}
              numColumns={2}
              columnWrapperStyle={styles.gridFila}
              scrollEnabled={false}
            />
          )}

          {mostrarAgregar && (
            <View style={styles.panelDesplegable}>
              <View style={styles.panelHeader}>
                <View>
                  <Text style={styles.panelTitulo}>Agregar ingrediente</Text>
                  <Text style={styles.panelTexto}>
                    Busca en el catálogo oficial.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.botonCerrar}
                  onPress={() => {
                    setMostrarAgregar(false);
                    setIngredienteSeleccionado(null);
                  }}
                >
                  <Text style={styles.botonCerrarTexto}>×</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.buscador}
                placeholder="Buscar tomate, arroz, pollo..."
                placeholderTextColor="#999"
                value={busqueda}
                onChangeText={buscarIngredientes}
              />

              <View style={styles.listaCompactaHeader}>
                <Text style={styles.listaCompactaTitulo}>
                  {busqueda.trim() ? "Resultados" : "Todos los ingredientes"}
                </Text>
                <Text style={styles.listaCompactaCantidad}>
                  {ingredientes.length}
                </Text>
              </View>

              <ScrollView
                style={styles.listaIngredientesScroll}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {ingredientes.map((item) => (
                  <View key={item.id_ingrediente.toString()}>
                    {renderIngrediente({ item })}
                  </View>
                ))}
              </ScrollView>

              {ingredienteSeleccionado && (
                <View style={styles.panelAgregar}>
                  <Text style={styles.panelTituloSecundario}>
                    Agregar {ingredienteSeleccionado.nombre}
                  </Text>

                  <View style={styles.inputsFila}>
                    <TextInput
                      style={[styles.inputPanel, styles.inputCantidad]}
                      placeholder="Cantidad"
                      keyboardType="numeric"
                      value={cantidad}
                      onChangeText={setCantidad}
                    />

                    <View style={styles.unidadFija}>
                      <Text style={styles.unidadTexto}>{unidad}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.botonAgregar}
                    onPress={agregarADespensa}
                  >
                    <Text style={styles.botonTexto}>Guardar en mi despensa</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 45 }} />

          <Modal
            visible={!!editandoItem}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setEditandoItem(null)}
          >
            <View style={styles.modalFondo}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalKeyboard}
              >
                <View style={styles.modalContenido}>
                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={styles.modalTitulo}>
                        Editar {editandoItem?.Ingredientes?.nombre}
                      </Text>
                      <Text style={styles.modalSubtitulo}>
                        Modifica la cantidad o unidad disponible.
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.botonCerrar}
                      onPress={() => setEditandoItem(null)}
                    >
                      <Text style={styles.botonCerrarTexto}>×</Text>
                    </TouchableOpacity>
                  </View>

                  {editandoItem?.Ingredientes?.imagen_url && (
                    <Image
                      source={{ uri: editandoItem.Ingredientes.imagen_url }}
                      style={styles.modalImagen}
                    />
                  )}

                  <View style={styles.inputsFila}>
                    <TextInput
                      style={[styles.inputPanel, styles.inputCantidad]}
                      placeholder="Cantidad"
                      keyboardType="numeric"
                      value={cantidadEditada}
                      onChangeText={setCantidadEditada}
                    />

                    <View style={styles.unidadFija}>
                      <Text style={styles.unidadTexto}>{unidadEditada}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.botonGuardarCambios}
                    onPress={guardarCambiosDespensa}
                  >
                    <Text style={styles.botonTexto}>Guardar cambios</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FAF7F0",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#FAF7F0",
  },
  listaIngredientesScroll: {
    maxHeight: 320,
    marginBottom: 10,
  },
  header: {
    paddingTop: 2,
    paddingBottom: 18,
  },
  logo: {
    fontSize: 40,
    fontWeight: "900",
    color: "#1E1E1E",
    letterSpacing: -1,
  },
  descripcion: {
    marginTop: 6,
    fontSize: 16,
    color: "#666",
    lineHeight: 23,
  },
  seccionHeaderPrincipal: {
    marginTop: 6,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seccionTituloGrande: {
    fontSize: 30,
    fontWeight: "900",
    color: "#222",
  },
  seccionSubtitulo: {
    marginTop: 3,
    fontSize: 14,
    color: "#777",
  },
  botonAbrirAgregar: {
    backgroundColor: "#2F7D32",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  botonAbrirAgregarTexto: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },
  gridFila: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  imagenDespensa: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "#EAEAEA",
    marginBottom: 10,
  },
  nombreDespensaGrid: {
    fontSize: 16,
    fontWeight: "900",
    color: "#222",
    textTransform: "capitalize",
    textAlign: "center",
  },
  cantidadDespensaGrid: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "800",
    color: "#2F7D32",
    textAlign: "center",
  },
  despensaVacia: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEE7DD",
    marginBottom: 14,
  },
  despensaVaciaTitulo: {
    fontSize: 17,
    fontWeight: "900",
    color: "#222",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    // El padding bottom dinámico se inyecta directamente desde el componente
  },
  despensaVaciaTexto: {
    marginTop: 6,
    color: "#777",
    lineHeight: 20,
  },
  panelDesplegable: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E8E2D8",
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  panelTitulo: {
    fontSize: 22,
    fontWeight: "900",
    color: "#222",
  },
  panelTexto: {
    marginTop: 4,
    color: "#777",
    fontSize: 14,
  },
  botonCerrar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
  },
  botonCerrarTexto: {
    fontSize: 24,
    color: "#444",
    lineHeight: 28,
  },
  buscador: {
    backgroundColor: "#FAFAFA",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E8E2D8",
    color: "#222",
    marginBottom: 14,
  },
  listaCompactaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  listaCompactaTitulo: {
    fontSize: 17,
    fontWeight: "900",
    color: "#222",
  },
  listaCompactaCantidad: {
    color: "#777",
    fontWeight: "700",
  },
  cardIngrediente: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEE7DD",
  },
  cardSeleccionada: {
    borderColor: "#2F7D32",
    borderWidth: 2,
  },
  imagenIngrediente: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: "#EAEAEA",
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nombreIngrediente: {
    fontSize: 17,
    fontWeight: "900",
    color: "#222",
    textTransform: "capitalize",
  },
  tipoIngrediente: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
    textTransform: "capitalize",
  },
  botonMas: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EDF7EE",
    alignItems: "center",
    justifyContent: "center",
  },
  mas: {
    color: "#2F7D32",
    fontSize: 24,
    fontWeight: "900",
    marginTop: -2,
  },
  panelAgregar: {
    marginTop: 8,
    backgroundColor: "#FAF7F0",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEE7DD",
  },
  panelTituloSecundario: {
    fontSize: 18,
    fontWeight: "900",
    color: "#222",
    textTransform: "capitalize",
  },
  inputsFila: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  inputPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    fontSize: 15,
    color: "#222",
  },
  inputCantidad: {
    flex: 1,
  },
  inputUnidad: {
    flex: 1,
  },
  botonAgregar: {
    marginTop: 14,
    backgroundColor: "#2F7D32",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  botonTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  botonEliminar: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFECEC",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  botonEliminarTexto: {
    color: "#C62828",
    fontSize: 20,
    fontWeight: "900",
    marginTop: -2,
  },
  cardDespensaGrid: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEE7DD",
    alignItems: "center",
    position: "relative",
  },
  editarTexto: {
    marginTop: 6,
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
  },
  botonGuardarCambios: {
    marginTop: 14,
    backgroundColor: "#1E5AA8",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalKeyboard: {
    width: "100%",
  },
  modalContenido: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E8E2D8",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitulo: {
    fontSize: 22,
    fontWeight: "900",
    color: "#222",
    textTransform: "capitalize",
  },
  modalSubtitulo: {
    marginTop: 4,
    fontSize: 14,
    color: "#777",
    maxWidth: 230,
  },
  modalImagen: {
    width: 100,
    height: 100,
    borderRadius: 24,
    alignSelf: "center",
    backgroundColor: "#EAEAEA",
    marginBottom: 18,
  },

  unidadFija: {
    flex: 1,
    backgroundColor: "#F3F3F3",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  unidadTexto: {
    fontSize: 16,
    fontWeight: "700",
    color: "#555",
  },
});