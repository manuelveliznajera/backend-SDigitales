// routes/RecurrenteRoute.js
import express from "express";
import { createCheckout } from "../controllers/RecurrenteController.js"; // Import nombrado y con extensión .js

const router = express.Router();

// POST /api/recurrente/checkout
router.post("/checkout", createCheckout);

export default router; // Export ES Modules