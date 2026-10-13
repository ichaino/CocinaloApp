import React, { useRef, useEffect, useState } from "react";
import { router } from "expo-router";
import logo from "../../assets/logo.png";
import googleLogo from "../../assets/google.png";
import { Ionicons } from "@expo/vector-icons";

import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Animated,
  ScrollView,
  Alert,
} from "react-native";

import { supabase } from "../../lib/supabase";

const Registro = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),

      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const BAD_WORDS = [
    "puta",
    "puto",
    "mierda",
    "culo",
    "wea",
    "weón",
    "weon",
    "ctm",
    "conchetumare",
    "conchesumadre",
    "maricon",
    "maricón",
    "pene",
    "vagina",
    "sexo",
    "porn",
    "porno",
    "fuck",
    "shit",
    "bitch",
    "asshole",
    "dick",
    "cock",
    "peruano",
  ];

  const normalizarTexto = (texto) => {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita tildes
      .replace(/[^a-z0-9]/g, ""); // elimina todo lo que no sea letra o número
  };

  const contienePalabrasProhibidas = (texto) => {
    const t = normalizarTexto(texto);

    return BAD_WORDS.some((word) => {
      const w = normalizarTexto(word);
      return t.includes(w);
    });
  };

  const registrarUsuario = async () => {
    try {
      if (
        !nombre.trim() ||
        !correo.trim() ||
        !password.trim() ||
        !confirmarPassword.trim()
      ) {
        Alert.alert(
          "Campos incompletos",
          "Completa todos los campos"
        );
        return;
      }

      if (password.length < 6) {
        Alert.alert(
          "Contraseña inválida",
          "Debe tener al menos 6 caracteres"
        );
        return;
      }

      if (password !== confirmarPassword) {
        Alert.alert(
          "Error",
          "Las contraseñas no coinciden"
        );
        return;
      }

      setLoading(true);

      console.log("Registrando usuario...");
      console.log("Correo:", correo);

      if (contienePalabrasProhibidas(nombre)) {
        Alert.alert(
          "Nombre inválido",
          "El nombre contiene palabras no permitidas"
        );
        return;
      }

      // validar correo (parte local del email)
      const correoSinDominio = correo.split("@")[0];

      if (contienePalabrasProhibidas(correoSinDominio)) {
        Alert.alert(
          "Correo inválido",
          "El correo contiene palabras no permitidas"
        );
        return;
      }

      // Crear usuario en Auth
      const { data, error } = await supabase.auth.signUp({
        email: correo,
        password: password,
      });

      console.log("DATA:", data);
      console.log("ERROR:", error);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      const authUser = data.user;

      if (!authUser) {
        Alert.alert(
          "Error",
          "No se pudo crear el usuario"
        );
        return;
      }

      // Guardar datos adicionales
      const { error: errorPerfil } = await supabase
        .from("Usuarios")
        .insert([
          {
            auth_id: authUser.id,
            correo: correo,
            nombres: nombre,
            edad: null,
            sexo: null,
            alergenos: null,
          },
        ]);

      if (errorPerfil) {
        Alert.alert(
          "Error al guardar perfil",
          errorPerfil.message
        );
        return;
      }

      Alert.alert(
        "Registro exitoso",
        "Gracias por unirte a nosotros."
      );

      await supabase.auth.signOut();

      router.replace("/login");
    } catch (error) {
      console.log("ERROR COMPLETO:");
      console.log(error);

      Alert.alert(
        "Error",
        error?.message
          ? error.message
          : JSON.stringify(error)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <Image
          source={logo}
          style={styles.image}
        />

        <Text style={styles.title}>
          Registro
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="person-outline"
            size={20}
            color="#888"
            style={styles.inputIcon}
          />

          <TextInput
            placeholder="Nombre completo"
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#888"
            style={styles.inputIcon}
          />

          <TextInput
            placeholder="Correo electrónico"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={correo}
            onChangeText={setCorreo}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#888"
            style={styles.inputIcon}
          />

          <TextInput
            placeholder="Contraseña"
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#888"
            style={styles.inputIcon}
          />

          <TextInput
            placeholder="Confirmar contraseña"
            style={styles.input}
            secureTextEntry
            value={confirmarPassword}
            onChangeText={setConfirmarPassword}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={registrarUsuario}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "Registrando..."
              : "Registrarse"}
          </Text>
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text>
            ¿Ya tienes una cuenta?
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.push("/login")
            }
          >
            <Text style={styles.register}>
              {" "}
              Iniciar sesión
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

export default Registro;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#FAF7F0",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 30,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,

    elevation: 5,
  },

  image: {
    width: 150,
    height: 150,
    alignSelf: "center",
    marginBottom: 30,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 30,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#fff",
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#2F7D32",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 30,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },

  register: {
    color: "#2F7D32",
    fontWeight: "bold",
  },

  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },

  separatorText: {
    marginHorizontal: 10,
    color: "#777",
  },

  googleButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,

    paddingVertical: 14,
  },

  googleText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
  },

  googleIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
});