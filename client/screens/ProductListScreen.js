import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../utils/api';
// Robust jwtDecode wrapper to support different bundler module shapes
const _jwtDecodeImpl = require('jwt-decode');
const jwtDecode = (token) => {
  try {
    if (typeof _jwtDecodeImpl === 'function') return _jwtDecodeImpl(token);
    if (_jwtDecodeImpl && typeof _jwtDecodeImpl.default === 'function') return _jwtDecodeImpl.default(token);
  } catch (e) {}
  try {
    const parts = String(token).split('.');
    if (parts.length < 2) return null;
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4 !== 0) payload += '=';
    const decoded = (typeof global.atob === 'function')
      ? global.atob(payload)
      : Buffer.from(payload, 'base64').toString('binary');
    try { return JSON.parse(decodeURIComponent(escape(decoded))); } catch (_) { return JSON.parse(decoded); }
  } catch (e) { return null; }
};
import * as SecureStore from 'expo-secure-store';

export default function ProductListScreen({ navigation, showAdmin = true }) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [nameFilter, setNameFilter] = useState('');
  const [role, setRole] = useState(null);

  useEffect(() => {
    const getRole = async () => {
      const token = await SecureStore.getItemAsync('jwtToken');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setRole(decoded?.role ?? null);
        } catch (e) {
          console.error("Error decoding JWT:", e);
          setRole(null);
        }
      } else {
        setRole(null);
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
      console.error("Error fetching products:", err);
      Alert.alert('Error', 'Failed to load products.');
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Products</Text>

        <TextInput
          style={styles.input}
          placeholder="Filter by name"
          value={nameFilter}
          onChangeText={setNameFilter}
        />

        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('ProductDetails', { product: item })}>
                <Text style={styles.itemText}>{`${item.name} - $${item.price} (Stock: ${item.stock})`}</Text>
              </TouchableOpacity>
            </View>
          )}
        />

        <View style={styles.pagination}>
          <TouchableOpacity onPress={() => setPage(Math.max(1, page - 1))} style={styles.pageBtn}>
            <Text style={styles.pageBtnText}>Previous</Text>
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>Page {page}</Text>
          <TouchableOpacity onPress={() => setPage(page + 1)} style={styles.pageBtn}>
            <Text style={styles.pageBtnText}>Next</Text>
          </TouchableOpacity>
        </View>

        {showAdmin && role === 'admin' && (
          <View style={styles.adminButtonContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard')} style={[styles.smallBtn, { backgroundColor: '#6c757d' }]}>
              <Text style={styles.smallBtnText}>Admin</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// Updated styles for better layout and consistency
const styles = StyleSheet.create({
  safeContainer: { 
    flex: 1 
  },
  container: { 
    flex: 1, 
    padding: 20, 
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10, 
    padding: 10 
  },
  item: { 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  itemText: {
    flexShrink: 1,
    marginRight: 10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  pageIndicator: {
    fontSize: 16,
    fontWeight: '600',
  },
  pageBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
    borderRadius: 6
  },
  pageBtnText: { color: '#fff', fontWeight: '600' },
  adminButtonContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  // minimal smallBtn used only for the admin quick link here
  smallBtn: {
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  smallBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});