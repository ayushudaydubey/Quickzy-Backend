import express from 'express';
import Product from '../models/products.js';
import isAdmin from '../middelware/isAdmin.js';
import { searchProduct } from '../controllers/productController.js';

const product_routes = express.Router();

// Get all products (Public) -- now supports ?search=term and ?category=CategoryName
product_routes.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (search && typeof search === 'string' && search.trim() !== '') {
      // case-insensitive partial match on title
      filter.title = { $regex: search.trim(), $options: 'i' };
    }

    if (category && typeof category === 'string' && category.trim() !== '') {
      filter.category = category.trim();
    }

    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    console.error('Failed to fetch products', err);
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
    const { title, description, image, price, category } = req.body;
    const newProduct = new Product({ title, description, image, price, category });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Validation failed", errors: err.errors, detail: err.message });
    }
    res.status(500).json({ message: "Failed to create product.", error: err.message });
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
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Validation failed", errors: err.errors, detail: err.message });
    }
    res.status(500).json({ message: "Failed to update product.", error: err.message });
  }
});

// Delete product (Admin only)
product_routes.delete('/:id', isAdmin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: " Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error while deleting product" });
  }
});

// product_routes.get("/find-product",searchProduct)

export default product_routes;
