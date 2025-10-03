import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Button, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';  // Import from safe-area-context
import api from '../utils/api';
import * as SecureStore from 'expo-secure-store';

export default function AdminDashboardScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => fetchProducts());
    fetchProducts();
    return unsub;
  }, [navigation, page]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { page, limit: 10 } });
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
    }
  };

  // Logout handler for admin: clear stored token + guest cart id and go Home
  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('jwtToken');
      await SecureStore.deleteItemAsync('guestCartId');
      navigation.navigate('Home');
    } catch (e) {
      console.error('Logout error', e);
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

  // Small compact button to save space in admin UI
  const SmallButton = ({ title, onPress, color = '#007AFF' }) => (
    <TouchableOpacity style={[styles.smallBtn, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.smallBtnText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">Admin Dashboard</Text>
          <View style={styles.headerActions}>
            <View style={styles.btnWrap}>
              <SmallButton title="Create" onPress={() => navigation.navigate('ProductEdit', { product: null })} color="#28a745" />
            </View>
            <View style={styles.btnWrap}>
              <SmallButton title="Logout" onPress={handleLogout} color="#d9534f" />
            </View>
          </View>
        </View>

        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.itemMain}>
                <Text style={styles.itemText}>{`${item.name} - $${item.price} (Stock: ${item.stock})`}</Text>
              </View>
              <View style={styles.buttonGroup}>
                <View style={styles.btnWrap}>
                  <SmallButton title="Edit" onPress={() => navigation.navigate('ProductEdit', { product: item })} color="#007AFF" />
                </View>
                <View style={styles.btnWrap}>
                  <SmallButton title="Del" onPress={() => handleDelete(item.id)} color="#d9534f" />
                </View>
              </View>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingRight: 8 },
  // title takes remaining space and will truncate if needed, leaving room for buttons
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1, marginRight: 8 },
  // actions kept compact; do not overflow the row
  headerActions: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemMain: { flex: 1, paddingRight: 10 },
  itemText: { fontSize: 16 },
  buttonGroup: { flexDirection: 'row', alignItems: 'center' },
  // smaller button wrappers to reduce visual footprint
  btnWrap: { marginLeft: 6, minWidth: 56 },
  smallBtn: {
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  smallBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }
});