import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import api from '../utils/api';
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
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    try {
      signupSchema.parse({ email, password });
      setLoading(true);
      await api.post('/auth/signup', { email, password });

      // Inform the user that the account was created
      Alert.alert('Success', 'Account successfully created');

      if (route?.params?.next === 'checkout') {
        try {
          const loginRes = await api.post('/auth/login', { email, password });
          await SecureStore.setItemAsync('jwtToken', loginRes.data.token);
          navigation.navigate('Cart', { autoCheckout: true });
          return;
        } catch (loginErr) {
          console.error('Auto-login after signup failed', loginErr);
          setError(loginErr.response?.data?.error || loginErr.message || 'Auto-login failed');
          setLoading(false);
          return;
        }
      }

      navigation.navigate('Login');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Signup</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.buttonWrap}>
        <Button title={loading ? 'Please wait...' : 'Signup'} onPress={handleSignup} disabled={loading} />
      </View>
      <View style={styles.buttonWrap}>
        <Button title="Go to Login" onPress={() => navigation.navigate('Login')} disabled={loading} />
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