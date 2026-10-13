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

const Login = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
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

  const iniciarSesion = async () => {
    try {
      if (!correo.trim() || !password.trim()) {
        Alert.alert("Error", "Completa todos los campos");
        return;
      }

      setLoading(true);

      console.log("Login...");
      console.log("Correo:", correo);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: correo,
        password: password,
      });

      console.log("DATA:", data);
      console.log("ERROR:", error);

      if (error) {
        const mensaje =
          error.message === "Invalid login credentials"
            ? "Correo o contraseña incorrectos"
            : error.message;

        Alert.alert("Error de inicio de sesión", mensaje);
        return;
      }

      if (!data.session) {
        Alert.alert("Error", "No se pudo iniciar sesión");
        return;
      }

      Alert.alert("Bienvenido", "Inicio de sesión exitoso");

      // 👉 aquí cambias a tu home
      router.replace("/(tabs)");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const recuperarPassword = async () => {
    if (!correo.trim()) {
      Alert.alert("Error", "Ingresa tu correo primero");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: "cocinaloapp://reset-password",
    });

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert("Revisa tu correo", "Te enviamos un enlace para cambiar tu contraseña");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <Image source={logo} style={styles.image} />

        <Text style={styles.title}>¡Bienvenido!</Text>
        <Text style={styles.descripcion}>
          Inicia sesión con tus credenciales
        </Text>

        {/* EMAIL */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#888"
            style={styles.inputIcon}
          />

          <TextInput
            placeholder="Email"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={correo}
            onChangeText={setCorreo}
          />
        </View>

        {/* PASSWORD */}
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

        {/* FORGOT */}
        <TouchableOpacity onPress={recuperarPassword}>
          <Text style={styles.forgot}>Olvidé mi contraseña</Text>
        </TouchableOpacity>

        {/* BUTTON */}
        <TouchableOpacity
          style={styles.button}
          onPress={iniciarSesion}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Text>
        </TouchableOpacity>

        {/* REGISTER */}
        <View style={styles.registerContainer}>
          <Text>No tienes una cuenta?</Text>

          <TouchableOpacity onPress={() => router.push("/registro")}>
            <Text style={styles.register}> Registrarse</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#FAF7F0",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 30,
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
  },

  descripcion: {
    color: "#888",
    marginBottom: 20,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 20,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    paddingVertical: 12,
  },

  button: {
    backgroundColor: "#2F7D32",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  forgot: {
    textAlign: "right",
    color: "#2F7D32",
    marginBottom: 20,
  },

  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },

  register: {
    color: "#2F7D32",
    fontWeight: "bold",
  },

  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
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
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    borderRadius: 10,
  },

  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
});