import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import api from '../utils/api';

export default function ProductEditScreen({ route, navigation }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const product = route.params?.product;

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price.toString());
      setStock(product.stock.toString());
    }
  }, [product]);

  const handleSubmit = async () => {
    try {
      const data = { name, description, price: parseFloat(price), stock: parseInt(stock) };
      if (product) {
        await api.put(`/products/${product.id}`, data);
      } else {
        await api.post('/products', data);
      }
      navigation.goBack();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text>{product ? 'Edit' : 'Create'} Product</Text>
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
      <TextInput style={styles.input} placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Stock" value={stock} onChangeText={setStock} keyboardType="numeric" />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: { borderWidth: 1, marginBottom: 10, padding: 10 },
});