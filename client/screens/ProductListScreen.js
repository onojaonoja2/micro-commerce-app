import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet } from 'react-native';
import api from '../utils/api';

export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [nameFilter, setNameFilter] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [page, nameFilter]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { page, limit: 10, name: nameFilter } });
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Products</Text>
      <TextInput style={styles.input} placeholder="Filter by name" value={nameFilter} onChangeText={setNameFilter} />
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.name} - ${item.price} (Stock: {item.stock})</Text>
          </View>
        )}
      />
      <Button title="Next Page" onPress={() => setPage(page + 1)} />
      <Button title="Admin Dashboard" onPress={() => navigation.navigate('AdminDashboard')} /> // Conditional later
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: { borderWidth: 1, marginBottom: 10, padding: 10 },
  item: { padding: 10, borderBottomWidth: 1 },
});