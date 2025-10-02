import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as z from 'zod';
import { jwtDecode } from 'jwt-decode';  // Changed to named import

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
      const decoded = jwtDecode(res.data.token);  // Uses named export
      if (decoded.role === 'admin') {
        navigation.navigate('AdminDashboard');
      } else {
        navigation.navigate('Home');
      }
    } catch (err) {
      console.error('Login error:', err);  // For debugger
      setError(err.response?.data?.error || err.message || 'Login failed - check credentials or network');
    }
  };

  return (
    <View style={styles.container}>
      <Text>Login</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title="Login" onPress={handleLogin} />
      <Button title="Go to Signup" onPress={() => navigation.navigate('Signup')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  input: { borderWidth: 1, marginBottom: 10, padding: 10 },
  error: { color: 'red' },
});