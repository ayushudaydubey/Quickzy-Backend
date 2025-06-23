import express from 'express';
import Product from '../models/products.js';
import isAdmin from '../middelware/isAdmin.js';

const product_routes = express.Router();

// Get all products (Public)
product_routes.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products." });
  }
});

// Get single product by ID (Public)
product_routes.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create product (Admin only)
product_routes.post('/', isAdmin, async (req, res) => {
  try {
    const { title, description, image, price } = req.body;
    const newProduct = new Product({ title, description, image, price });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: "Failed to create product." });
  }
});

// Update product (Admin only)
product_routes.put('/:id', isAdmin, async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updatedProduct) return res.status(404).json({ message: "Product not found" });
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: "Failed to update product." });
  }
});

// Delete product (Admin only)
product_routes.delete('/:id', isAdmin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "✅ Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error while deleting product" });
  }
});

export default product_routes;
