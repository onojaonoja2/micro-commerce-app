import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import * as z from 'zod';
import * as SecureStore from 'expo-secure-store';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function SignupScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    try {
      signupSchema.parse({ email, password });
      await axios.post('http://192.168.0.114:3000/auth/signup', { email, password });
      
      // If user intended to checkout, auto-login and continue
      if (route?.params?.next === 'checkout') {
        try {
          const loginRes = await axios.post('http://192.168.0.114:3000/auth/login', { email, password });
          await SecureStore.setItemAsync('jwtToken', loginRes.data.token);
          // Navigate to Cart and instruct it to auto-checkout
          navigation.navigate('Cart', { autoCheckout: true });
          return;
        } catch (loginErr) {
          // Fallthrough to normal flow (navigate to Login) if auto-login fails
          console.error('Auto-login after signup failed', loginErr);
        }
      }

      navigation.navigate('Login');
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Signup failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text>Signup</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.buttonWrap}>
        <Button title="Signup" onPress={handleSignup} />
      </View>
      <View style={styles.buttonWrap}>
        <Button title="Go to Login" onPress={() => navigation.navigate('Login')} />
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