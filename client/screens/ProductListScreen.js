import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';  // Import from safe-area-context
import api from '../utils/api';
import { jwtDecode } from 'jwt-decode';
import * as SecureStore from 'expo-secure-store';

export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [nameFilter, setNameFilter] = useState('');
  const [role, setRole] = useState(null);

  useEffect(() => {
    const getRole = async () => {
      const token = await SecureStore.getItemAsync('jwtToken');
      if (token) {
        const decoded = jwtDecode(token);
        setRole(decoded.role);
      }
    };
    getRole();
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
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <Text>Products</Text>
        <TextInput style={styles.input} placeholder="Filter by name" value={nameFilter} onChangeText={setNameFilter} />
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text>{`${item.name} - $${item.price} (Stock: ${item.stock})`}</Text>
            </View>
          )}
        />
        <View style={styles.pagination}>
          <Button title="Previous" onPress={() => setPage(Math.max(1, page - 1))} disabled={page === 1} />
          <Button title="Next" onPress={() => setPage(page + 1)} />
        </View>
        {role === 'admin' && (
          <Button title="Admin Dashboard" onPress={() => navigation.navigate('AdminDashboard')} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1 },
  container: { flex: 1, padding: 20, paddingBottom: 50 },
  input: { borderWidth: 1, marginBottom: 10, padding: 10 },
  item: { padding: 10, borderBottomWidth: 1 },
  pagination: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
});