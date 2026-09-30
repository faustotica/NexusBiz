const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// 1. Obtener todos los productos
router.get('/', async (req, res) => {
    try {
    const products = await Product.find();
    res.json(products);
    } catch (error) {
    res.status(500).json({ error: 'Error al obtener los productos' });
    }
});

// 2. Crear un nuevo producto (para poblar el inventario)
router.post('/', async (req, res) => {
    try {
    const { name, category, price, stock, description } = req.body;
    const newProduct = new Product({ name, category, price, stock, description });
    await newProduct.save();
    res.status(201).json({ message: 'Producto creado con éxito', product: newProduct });
    }  catch (error) {
    res.status(400).json({ error: 'Error al crear el producto', details: error.message });
    }
});

module.exports = router;