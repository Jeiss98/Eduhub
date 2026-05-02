// config/mongodb.js — Conexión Mongoose a MongoDB Atlas
const mongoose = require('mongoose');
require('dotenv').config();

async function connectMongo() {
    const uri = process.env.MONGO_URI;
    if (!uri || uri.includes('<user>')) {
        console.warn('⚠️  MongoDB: MONGO_URI no configurado en .env — noticias deshabilitadas.');
        return;
    }
    try {
        await mongoose.connect(uri);
        console.log('✅ MongoDB Atlas conectado → eduhub_noticias');
    } catch (err) {
        console.error('❌ MongoDB ERROR:', err.message);
        console.warn('   Noticias no disponibles. Verifica MONGO_URI en .env');
    }
}

module.exports = { connectMongo };
