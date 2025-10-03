import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api';
import * as SecureStore from 'expo-secure-store';

export default function CartScreen({ navigation, route }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [autoTriggered, setAutoTriggered] = useState(false); // prevent double-trigger

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (route?.params?.autoCheckout && !autoTriggered) {
      setTimeout(() => {
        handleCheckout();
      }, 300);
    }
  }, [route?.params?.autoCheckout, items, autoTriggered]);

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

  // update quantity to a specific value (0 removes)
  const updateQuantity = async (productId, newQty) => {
    try {
      const res = await api.post('/cart/update', { productId, quantity: newQty });
      if (res.data?.sessionId) {
        await SecureStore.setItemAsync('guestCartId', res.data.sessionId);
      }
      fetchCart();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update cart';
      Alert.alert('', msg);
    }
  };

  const decQuantity = (productId, currentQty) => {
    const next = Math.max(0, currentQty - 1);
    updateQuantity(productId, next);
  };
  const incQuantity = (productId, currentQty) => {
    const next = currentQty + 1;
    updateQuantity(productId, next);
  };

  const handleCheckout = async () => {
    try {
      const token = await SecureStore.getItemAsync('jwtToken');
      if (!token) {
        navigation.navigate('Signup', { next: 'checkout' });
        return;
      }
      setAutoTriggered(true);
      await api.post('/orders');
      Alert.alert('', 'Order placed!');
      navigation.navigate('Home');
    } catch (err) {
      const msg = err.response?.data?.error || 'Checkout failed';
      Alert.alert('', msg);
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
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text>{'$' + item.subtotal}</Text>
              </View>
              <View style={styles.qtyControls}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => decQuantity(item.product_id || item.productId, item.quantity)}>
                  <Text style={styles.qtyText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyDisplay}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => incQuantity(item.product_id || item.productId, item.quantity)}>
                  <Text style={styles.qtyText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.productId)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
           </View>
          )}
        />
        <Text>Total: ${total}</Text>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1 },
  container: { flex: 1, padding: 20, paddingBottom: 50 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1 },
  itemTitle: { fontWeight: '600' },
  qtyControls: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 30, height: 30, borderRadius: 6, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginHorizontal: 6 },
  qtyText: { fontSize: 18, fontWeight: '600' },
  qtyDisplay: { minWidth: 24, textAlign: 'center' },
  removeBtn: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#d9534f', borderRadius: 6 },
  removeText: { color: '#fff' },
  checkoutBtn: { marginTop: 12, backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  checkoutText: { color: '#fff', fontWeight: '700' }
});