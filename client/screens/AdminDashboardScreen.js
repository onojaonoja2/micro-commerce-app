import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import api from '../utils/api';

export default function AdminDashboardScreen({ navigation }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
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
    <View style={styles.container}>
      <Text>Admin Dashboard</Text>
      <Button title="Create Product" onPress={() => navigation.navigate('ProductEdit', { product: null })} />
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.name}</Text>
            <Button title="Edit" onPress={() => navigation.navigate('ProductEdit', { product: item })} />
            <Button title="Delete" onPress={() => handleDelete(item.id)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  item: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1 },
});