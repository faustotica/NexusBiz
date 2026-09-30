const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/aiController');

// Endpoint POST para interactuar con el agente de IA
router.post('/chat', chatWithAI);

module.exports = router;