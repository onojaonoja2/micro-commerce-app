import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import api from '../utils/api';
import * as SecureStore from 'expo-secure-store';

export default function ProductDetailsScreen({ route, navigation }) {
  const product = route.params?.product;
  const [loading, setLoading] = useState(false);

  if (!product) {
    return (
      <View style={styles.center}><Text>Product not found</Text></View>
    );
  }

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      const res = await api.post('/cart/add', { productId: product.id, quantity: 1 });
      if (res.data?.sessionId) {
        await SecureStore.setItemAsync('guestCartId', res.data.sessionId);
      }
      Alert.alert('', 'Added to cart');
    } catch (err) {
      console.error('Add to cart error', err);
      const msg = err.response?.data?.error || 'Failed to add to cart';
      Alert.alert('', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{product.name}</Text>
      <Text style={styles.price}>${product.price}</Text>
      <Text style={styles.desc}>{product.description || 'No description'}</Text>
      <Text style={styles.stock}>Stock: {product.stock}</Text>
      <Button title="Add to Cart" onPress={handleAddToCart} disabled={loading || product.stock === 0} />
      <View style={{ height: 10 }} />
      <Button title="Go to Cart" onPress={() => navigation.navigate('Cart')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  price: { fontSize: 18, marginBottom: 8 },
  desc: { marginBottom: 8 },
  stock: { marginBottom: 16 },
});
