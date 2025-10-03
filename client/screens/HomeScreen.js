import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ProductListScreen from './ProductListScreen';
import * as SecureStore from 'expo-secure-store';
import api from '../utils/api';

export default function HomeScreen({ navigation }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasCart, setHasCart] = useState(false);

  // Check token and guestCartId on mount and whenever screen gains focus
  useEffect(() => {
    const check = async () => {
      const token = await SecureStore.getItemAsync('jwtToken');
      setIsLoggedIn(Boolean(token));
      // Try to fetch cart (works for guest via persisted guestCartId header, or for auth user)
      try {
        const res = await api.get('/cart');
        setHasCart((res.data?.items?.length || 0) > 0);
      } catch (e) {
        // fallback: check SecureStore guestCartId
        const guest = await SecureStore.getItemAsync('guestCartId');
        setHasCart(Boolean(guest));
      }
    };
    check();
    const unsub = navigation.addListener('focus', check);
    return unsub;
  }, [navigation]);

  // Logout handler: clear stored token and guest cart id, then return to Home
  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('jwtToken');
      await SecureStore.deleteItemAsync('guestCartId');
      setIsLoggedIn(false);
      setHasCart(false);
      navigation.navigate('Home');
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  // Small compact button (same look as admin)
  const SmallButton = ({ title, onPress, color = '#007AFF', disabled = false }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.smallBtn,
        { backgroundColor: color, opacity: disabled ? 0.5 : 1 }
      ]}
      disabled={disabled}
    >
      <Text style={styles.smallBtnText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nexcom</Text>
        {/* Right side auth buttons — only visible when not logged in */}
        {!isLoggedIn ? (
          <View style={styles.authRowRight}>
            <SmallButton title="Login" onPress={() => navigation.navigate('Login')} color="#007AFF" />
            <View style={styles.spacer} />
            <SmallButton title="Signup" onPress={() => navigation.navigate('Signup')} color="#28a745" />
          </View>
        ) : (
          <View style={styles.authRowRight}>
            <SmallButton title="Orders" onPress={() => navigation.navigate('Orders')} color="#6c757d" />
            <View style={styles.spacer} />
            <SmallButton title="Logout" onPress={handleLogout} color="#d9534f" />
          </View>
        )}
      </View>

      {/* Show View Cart for any user once their cart has items */}
      {hasCart && (
        <View style={styles.viewCartWrap}>
          <SmallButton title="View Cart" onPress={() => navigation.navigate('Cart')} color="#007AFF" />
        </View>
      )}

      {/* Embedded product list so visitors see products immediately */}
      <View style={styles.products}>
        <ProductListScreen navigation={navigation} showAdmin={false} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  authRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: { width: 10 },
  products: { flex: 1 },
  viewCartWrap: { padding: 12, paddingHorizontal: 20, backgroundColor: '#fafafa', borderBottomWidth: 1, borderBottomColor: '#eee' },
  // small button styles (matching admin compact style)
  smallBtn: {
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  smallBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});