import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Button } from 'react-native';
import api from '../utils/api';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders', { params: { page, limit } });
      setOrders(res.data.orders || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Fetch orders error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchOrders);
    fetchOrders();
    return unsub;
  }, [navigation, page]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}>
            <Text style={styles.title}>Order #{item.id} — {item.item_count || 0} items</Text>
            <Text>Total: ${item.total.toFixed(2)}</Text>
            <Text style={styles.date}>{item.created_at}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.center}><Text>No orders yet</Text></View>}
      />
      <View style={styles.pagination}>
        <Button title="Previous" onPress={() => setPage(Math.max(1, page - 1))} disabled={page === 1} />
        <Text style={{ alignSelf: 'center' }}> Page {page} </Text>
        <Button title="Next" onPress={() => {
          const maxPage = Math.ceil(total / limit) || 1;
          if (page < maxPage) setPage(page + 1);
        }} disabled={page >= Math.ceil(total / limit)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  item: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 16, fontWeight: '600' },
  date: { color: '#666', marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 }
});
