import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';  // Import from safe-area-context
import api from '../utils/api';

export default function AdminDashboardScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { page, limit: 10 } });
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <Text>Admin Dashboard</Text>
        <Button title="Create Product" onPress={() => navigation.navigate('ProductEdit', { product: null })} />
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text>{`${item.name} - $${item.price} (Stock: ${item.stock})`}</Text>
              <Button title="Edit" onPress={() => navigation.navigate('ProductEdit', { product: item })} />
              <Button title="Delete" onPress={() => handleDelete(item.id)} />
            </View>
          )}
        />
        <View style={styles.pagination}>
          <Button title="Previous" onPress={() => setPage(Math.max(1, page - 1))} disabled={page === 1} />
          <Button title="Next" onPress={() => setPage(page + 1)} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1 },
  container: { flex: 1, padding: 20, paddingBottom: 50 },
  item: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1 },
  pagination: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
});