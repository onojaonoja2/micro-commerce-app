import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as z from 'zod';
//import { jwtDecode } from 'jwt-decode';

// Robust jwtDecode wrapper: handles function export, { default: fn } and a payload fallback
const _jwtDecodeImpl = require('jwt-decode');
const jwtDecode = (token) => {
  try {
    if (typeof _jwtDecodeImpl === 'function') return _jwtDecodeImpl(token);
    if (_jwtDecodeImpl && typeof _jwtDecodeImpl.default === 'function') return _jwtDecodeImpl.default(token);
  } catch (e) {}
  // Fallback: decode JWT payload without external lib (assumes base64url)
  try {
    const parts = String(token).split('.');
    if (parts.length < 2) return null;
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if required
    while (payload.length % 4 !== 0) payload += '=';
    const decoded = (typeof global.atob === 'function')
      ? global.atob(payload)
      : Buffer.from(payload, 'base64').toString('binary'); // Buffer may not exist in RN but kept as fallback
    // Convert binary string to UTF-8 string
    try {
      return JSON.parse(decodeURIComponent(escape(decoded)));
    } catch (_) {
      return JSON.parse(decoded);
    }
  } catch (e) {
    return null;
  }
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      loginSchema.parse({ email, password });
      const res = await axios.post('http://192.168.0.114:3000/auth/login', { email, password });
      await SecureStore.setItemAsync('jwtToken', res.data.token);
      const decoded = jwtDecode(res.data.token);
      if (decoded.role === 'admin') {
        navigation.navigate('AdminDashboard');
      } else {
        navigation.navigate('Home');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || err.message || 'Login failed - check credentials or network');
    }
  };

  return (
    <View style={styles.container}>
      <Text>Login</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.buttonWrap}>
        <Button title="Login" onPress={handleLogin} />
      </View>
      <View style={styles.buttonWrap}>
        <Button title="Go to Signup" onPress={() => navigation.navigate('Signup')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  input: { borderWidth: 1, marginBottom: 10, padding: 10 },
  error: { color: 'red' },
  buttonWrap: { marginTop: 10 } // spacing between buttons
});