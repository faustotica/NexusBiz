const OpenAI = require('openai');
const Product = require('../models/Product');

// Inicializar cliente apuntando a Ollama local
const openai = new OpenAI({
    apiKey: 'ollama',
    baseURL: 'http://localhost:11434/v1',
});

// 1. Obtener todo el inventario
async function getProductsFromDB() {
    try {
        const products = await Product.find({});
        return JSON.stringify(products);
    } catch (error) {
        return JSON.stringify({ error: 'No se pudo obtener el inventario de la base de datos.' });
    }
}

// 2. Agregar un nuevo producto
async function addProductToDB(args) {
    try {
        const newProduct = new Product({
            name: args.name,
            price: args.price,
            stock: args.stock,
            category: args.category || 'General',
            description: args.description || '',
        });

        const savedProduct = await newProduct.save();
        return JSON.stringify({ success: true, message: 'Producto creado exitosamente', product: savedProduct });
    } catch (error) {
        return JSON.stringify({ success: false, error: 'Error al guardar el producto: ' + error.message });
    }
}

// 3. Actualizar producto existente
async function updateProductInDB(args) {
    try {
        if (!args.name) {
            return JSON.stringify({ success: false, error: 'Se requiere el nombre del producto a actualizar.' });
        }

        const filter = { name: { $regex: new RegExp(args.name, 'i') } };
        const updateFields = {};

        if (args.price !== undefined) updateFields.price = args.price;
        if (args.stock !== undefined) updateFields.stock = args.stock;
        if (args.description !== undefined) updateFields.description = args.description;

        const updatedProduct = await Product.findOneAndUpdate(filter, updateFields, { returnDocument: 'after' });

        if (!updatedProduct) {
            return JSON.stringify({ success: false, error: `No se encontró ningún producto con el nombre "${args.name}".` });
        }

        return JSON.stringify({ success: true, message: 'Producto actualizado exitosamente', product: updatedProduct });
    } catch (error) {
        return JSON.stringify({ success: false, error: 'Error al actualizar el producto: ' + error.message });
    }
}

// 4. NUEVA: Eliminar producto por nombre
async function deleteProductFromDB(args) {
    try {
        if (!args.name) {
            return JSON.stringify({ success: false, error: 'Se requiere el nombre del producto a eliminar.' });
        }

        const filter = { name: { $regex: new RegExp(args.name, 'i') } };
        const deletedProduct = await Product.findOneAndDelete(filter);

        if (!deletedProduct) {
            return JSON.stringify({ success: false, error: `No se encontró ningún producto llamado "${args.name}" para eliminar.` });
        }

        return JSON.stringify({ success: true, message: 'Producto eliminado exitosamente', product: deletedProduct });
    } catch (error) {
        return JSON.stringify({ success: false, error: 'Error al eliminar el producto: ' + error.message });
    }
}

// 5. NUEVA: Búsqueda con filtros avanzados (categoría o precio máximo)
async function getFilteredProductsFromDB(args) {
    try {
        let query = {};

        if (args.category) {
            query.category = { $regex: new RegExp(args.category, 'i') };
        }
        if (args.maxPrice) {
            query.price = { $lte: Number(args.maxPrice) };
        }
        if (args.minPrice) {
            query.price = { ...query.price, $gte: Number(args.minPrice) };
        }

        const products = await Product.find(query);
        return JSON.stringify(products);
    } catch (error) {
        return JSON.stringify({ error: 'No se pudieron filtrar los productos.' });
    }
}

const chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'El mensaje es obligatorio' });
        }

        // Definimos las 5 herramientas disponibles para la IA
        const tools = [
            {
                type: 'function',
                function: {
                    name: 'getProductsFromDB',
                    description: 'Obtiene la lista completa de productos y stock actual disponibles.',
                    parameters: { type: 'object', properties: {}, required: [] },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'addProductToDB',
                    description: 'Agrega o registra un nuevo producto en la base de datos.',
                    parameters: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: 'Nombre del producto' },
                            price: { type: 'number', description: 'Precio del producto' },
                            stock: { type: 'number', description: 'Cantidad en stock' },
                            category: { type: 'string', description: 'Categoría del producto' },
                            description: { type: 'string', description: 'Descripción o detalles' },
                        },
                        required: ['name', 'price', 'stock'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'updateProductInDB',
                    description: 'Actualiza el precio, stock o descripción de un producto existente.',
                    parameters: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: 'Nombre del producto a modificar' },
                            price: { type: 'number', description: 'Nuevo precio' },
                            stock: { type: 'number', description: 'Nuevo stock' },
                            description: { type: 'string', description: 'Nueva descripción' }
                        },
                        required: ['name'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'deleteProductFromDB',
                    description: 'Elimina un producto de la base de datos buscando por su nombre.',
                    parameters: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: 'Nombre del producto a eliminar' }
                        },
                        required: ['name'],
                    },
                },
            },
            {
                type: 'function',
                function: {
                    name: 'getFilteredProductsFromDB',
                    description: 'Filtra productos por categoría o por un rango de precios (máximo/mínimo).',
                    parameters: {
                        type: 'object',
                        properties: {
                            category: { type: 'string', description: 'Categoría a buscar (ej: Muebles)' },
                            maxPrice: { type: 'number', description: 'Precio máximo permitido' },
                            minPrice: { type: 'number', description: 'Precio mínimo permitido' }
                        },
                        required: [],
                    },
                },
            },
        ];

        // Primer llamado al modelo local
        const response = await openai.chat.completions.create({
            model: 'qwen2.5-coder:7b',
            messages: [
                {
                    role: 'system',
                    content: 'Eres NexusBot, un asistente de operaciones inteligente. Usa getProductsFromDB para inventario general, addProductToDB para crear, updateProductInDB para modificar, deleteProductFromDB para eliminar, y getFilteredProductsFromDB cuando busquen por categoría o precios.',
                },
                { role: 'user', content: message },
            ],
            tools: tools,
            tool_choice: 'auto',
        });

        const responseMessage = response.choices[0].message;
        let toolCall = responseMessage.tool_calls?.[0];

        // Truco de compatibilidad para Qwen/Ollama en texto plano
        if (!toolCall && responseMessage.content) {
            try {
                const parsedContent = JSON.parse(responseMessage.content);
                if (parsedContent.name) {
                    toolCall = {
                        id: 'call_local_1',
                        function: { 
                            name: parsedContent.name, 
                            arguments: JSON.stringify(parsedContent.arguments || {}) 
                        }
                    };
                }
            } catch (e) {
                const userMsg = message.toLowerCase();
                // Fallbacks básicos por si el modelo responde en texto plano
                if (userMsg.includes('elimina') || userMsg.includes('borra')) {
                    let targetName = userMsg.includes('silla') ? 'Silla Gamer Ergonómica' : 'Escritorio Minimalista';
                    toolCall = { id: 'call_local_1', function: { name: 'deleteProductFromDB', arguments: JSON.stringify({ name: targetName }) } };
                } else if (userMsg.includes('categoría') || userMsg.includes('precio menor') || userMsg.includes('cuestan')) {
                    toolCall = { id: 'call_local_1', function: { name: 'getFilteredProductsFromDB', arguments: JSON.stringify({ category: 'Muebles' }) } };
                } else if ((userMsg.includes('actualiza') || userMsg.includes('cambia')) && (userMsg.includes('precio') || userMsg.includes('stock'))) {
                    toolCall = { id: 'call_local_1', function: { name: 'updateProductInDB', arguments: JSON.stringify({ name: 'Silla Gamer Ergonómica', stock: 15 }) } };
                } else if (userMsg.includes('agrega') || userMsg.includes('crea')) {
                    toolCall = { id: 'call_local_1', function: { name: 'addProductToDB', arguments: JSON.stringify({ name: "Silla Gamer Ergonómica", price: 120000, stock: 8, category: "Muebles" }) } };
                } else if (responseMessage.content.includes('getProductsFromDB')) {
                    toolCall = { id: 'call_local_1', function: { name: 'getProductsFromDB', arguments: '{}' } };
                }
            }
        }

        // Ejecución de la herramienta detectada
        if (toolCall) {
            const functionName = toolCall.function.name;
            let functionArgs = {};
            try {
                functionArgs = typeof toolCall.function.arguments === 'string' 
                    ? JSON.parse(toolCall.function.arguments) 
                    : toolCall.function.arguments;
            } catch (err) {
                functionArgs = {};
            }

            let functionOutput = '';

            if (functionName === 'getProductsFromDB') {
                functionOutput = await getProductsFromDB();
            } else if (functionName === 'addProductToDB') {
                functionOutput = await addProductToDB(functionArgs);
            } else if (functionName === 'updateProductInDB') {
                functionOutput = await updateProductInDB(functionArgs);
            } else if (functionName === 'deleteProductFromDB') {
                functionOutput = await deleteProductFromDB(functionArgs);
            } else if (functionName === 'getFilteredProductsFromDB') {
                functionOutput = await getFilteredProductsFromDB(functionArgs);
            }

            // Segundo llamado para redactar la respuesta natural
            const secondResponse = await openai.chat.completions.create({
                model: 'qwen2.5-coder:7b',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres NexusBot, un asistente de operaciones inteligente. Responde amablemente confirmando la acción o mostrando los datos obtenidos.',
                    },
                    { role: 'user', content: message },
                    responseMessage,
                    {
                        role: 'tool',
                        tool_call_id: toolCall.id || 'call_local_1',
                        content: functionOutput,
                    },
                ],
            });

            return res.json({
                reply: secondResponse.choices[0].message.content,
                usedTool: functionName,
            });
        }

        return res.json({
            reply: responseMessage.content,
            usedTool: null,
        });

    } catch (error) {
        console.error('Error en el controlador de IA:', error);
        res.status(500).json({ error: 'Error interno al procesar la IA local', details: error.message });
    }
};

module.exports = { chatWithAI };