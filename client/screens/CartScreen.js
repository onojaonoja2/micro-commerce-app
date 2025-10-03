import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api';
import * as SecureStore from 'expo-secure-store';

export default function CartScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setItems(res.data.items);
      setTotal(res.data.total);
      if (res.data?.sessionId) {
        await SecureStore.setItemAsync('guestCartId', res.data.sessionId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async (productId) => {
    try {
      const res = await api.post('/cart/remove', { productId });
      if (res.data?.sessionId) {
        await SecureStore.setItemAsync('guestCartId', res.data.sessionId);
      }
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = async () => {
    try {
      await api.post('/orders');
      alert('Order placed!');
      navigation.navigate('Home');
    } catch (err) {
      alert(err.response?.data?.error || 'Checkout failed');
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <Text>Cart</Text>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text>{item.name + ' x' + item.quantity + ' - $' + item.subtotal}</Text>
              <Button title="Remove" onPress={() => handleRemove(item.productId)} />
            </View>
          )}
        />
        <Text>Total: ${total}</Text>
        <Button title="Checkout" onPress={handleCheckout} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1 },
  container: { flex: 1, padding: 20, paddingBottom: 50 },
  item: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1 },
});