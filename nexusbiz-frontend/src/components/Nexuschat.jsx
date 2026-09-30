import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function NexusChat() {
    const [messages, setMessages] = useState(() => {
        const savedMessages = localStorage.getItem('nexusbiz_chat_history');
        if (savedMessages) {
            try {
                return JSON.parse(savedMessages);
            } catch (e) {
                console.error("Error al cargar el historial", e);
            }
        }
        return [
            { role: 'assistant', content: '¡Hola! Soy NexusBot, tu asistente de operaciones. ¿Qué deseas hacer con el inventario?' }
        ];
    });

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const quickPrompts = [
        "Listar todos los productos",
        "¿Cuáles son los precios más altos?",
        "Mostrar stock bajo"
    ];

    useEffect(() => {
        localStorage.setItem('nexusbiz_chat_history', JSON.stringify(messages));
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const sendMessage = async (textToSend) => {
        if (!textToSend.trim() || loading) return;

        const newMessages = [...messages, { role: 'user', content: textToSend }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: textToSend }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
            } else {
                setMessages([...newMessages, { role: 'assistant', content: 'Error: ' + (data.error || 'No se pudo procesar la solicitud.') }]);
            }
        } catch (error) {
            setMessages([...newMessages, { role: 'assistant', content: 'Error de conexión con el servidor backend.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
        setInput('');
    };

    const handleQuickClick = (promptText) => {
        sendMessage(promptText);
    };

    const clearHistory = () => {
        const initialMessage = [{ role: 'assistant', content: '¡Hola! Soy NexusBot, tu asistente de operaciones. ¿Qué deseas hacer con el inventario?' }];
        setMessages(initialMessage);
        localStorage.removeItem('nexusbiz_chat_history');
    };

    return (
        <div className="flex flex-col h-[680px] w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200">
            {/* Cabecera del Chat */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shadow-md">
                <div className="flex items-center space-x-3">
                    <div className="relative flex items-center justify-center">
                        <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping absolute"></div>
                        <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full relative"></div>
                    </div>
                    <div>
                        <h2 className="font-bold text-lg tracking-wide">NexusBot IA</h2>
                        <p className="text-xs text-slate-400">Gestión Inteligente de Inventario</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-emerald-400 font-medium">
                        Ollama Local (Qwen)
                    </span>
                    <button
                        onClick={clearHistory}
                        title="Borrar historial"
                        className="text-xs bg-slate-800 hover:bg-rose-900/50 hover:border-rose-700 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition-colors"
                    >
                        🗑️ Limpiar
                    </button>
                </div>
            </div>

            {/* Historial de Mensajes */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none font-normal'
                                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none whitespace-pre-line'
                                }`}
                        >
                            {msg.role === 'user' ? (
                                msg.content
                            ) : (
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white text-slate-500 px-4 py-3 rounded-2xl shadow-sm border border-slate-200 text-sm italic flex items-center space-x-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            <span className="pl-1">NexusBot está consultando la base de datos...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Chips de Acceso Rápido */}
            <div className="px-4 py-2 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto">
                {quickPrompts.map((prompt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleQuickClick(prompt)}
                        disabled={loading}
                        className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 font-medium px-3 py-1.5 rounded-full border border-slate-200 transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                        ⚡ {prompt}
                    </button>
                ))}
            </div>

            {/* Input de Texto y Enviar */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-200 flex gap-3 items-center">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe una orden o usa los accesos rápidos..."
                    className="flex-1 px-4 py-3 bg-slate-100 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-sm transition-all"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors shadow-md disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                >
                    {loading ? 'Enviando...' : 'Enviar'}
                </button>
            </form>
        </div>
    );
}