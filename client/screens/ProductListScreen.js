import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
        // Use a safe version of jwtDecode or ensure it's imported correctly
        try {
          const decoded = jwtDecode(token);
          setRole(decoded.role);
        } catch (e) {
          console.error("Error decoding JWT:", e);
          setRole(null); // Clear role on error
        }
      }
    };
    getRole();
    fetchProducts();
  }, [page, nameFilter]);

  const fetchProducts = async () => {
    try {
      // Use Alert to be consistent with the other instruction's use of alert()
      const res = await api.get('/products', { params: { page, limit: 10, name: nameFilter } });
      setProducts(res.data.products);
    } catch (err) {
      console.error("Error fetching products:", err);
      Alert.alert('Error', 'Failed to load products.');
    }
  };

  // Function to handle adding a product to the cart
  const handleAddToCart = async (productId) => {
    try {
      await api.post('/cart/add', { productId, quantity: 1 });
      Alert.alert('Success', 'Product added to cart!');
    } catch (err) {
      console.error("Error adding to cart:", err);
      // Display a user-friendly error
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Products</Text>
        
        {/* View Cart Button */}
        <Button 
          title="View Cart" 
          onPress={() => navigation.navigate('Cart')} 
        />
        
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
              <Text style={styles.itemText}>{`${item.name} - $${item.price} (Stock: ${item.stock})`}</Text>
              
              {/* Add to Cart Button */}
              <Button 
                title="Add to Cart" 
                onPress={() => handleAddToCart(item.id)} 
                disabled={item.stock === 0} // Optional: Disable if stock is 0
              />
            </View>
          )}
        />
        
        <View style={styles.pagination}>
          <Button 
            title="Previous" 
            onPress={() => setPage(Math.max(1, page - 1))} 
            disabled={page === 1} 
          />
          <Text style={styles.pageIndicator}>Page {page}</Text>
          <Button 
            title="Next" 
            onPress={() => setPage(page + 1)} 
          />
        </View>
        
        {role === 'admin' && (
          <View style={styles.adminButtonContainer}>
            <Button 
              title="Admin Dashboard" 
              onPress={() => navigation.navigate('AdminDashboard')} 
            />
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
  adminButtonContainer: {
    marginTop: 10,
    marginBottom: 10, // Added to provide space at the bottom
  }
});