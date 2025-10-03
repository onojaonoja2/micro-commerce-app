import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../utils/api';

export default function OrderDetailsScreen({ route }) {
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDetails = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data.order);
      setItems(res.data.items || []);
    } catch (err) {
      console.error('Fetch order details error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [orderId]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (!order) return <View style={styles.center}><Text>Order not found</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Order #{order.id}</Text>
      <Text style={styles.sub}>Placed: {order.created_at}</Text>
      <Text style={styles.sub}>Total: ${order.total.toFixed(2)}</Text>

      <FlatList
        data={items}
        keyExtractor={(it) => `${it.product_id}`}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>{item.quantity} x ${item.price.toFixed(2)} = ${item.subtotal.toFixed(2)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No items</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  sub: { marginBottom: 6 },
  item: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  name: { fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
