// server.js — Solo MongoDB, sin MySQL
require('dotenv').config();
const app = require('./src/app');
const { connectMongo } = require('./src/config/mongodb');

const PORT = process.env.PORT || 3000;

async function start() {
  await connectMongo();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 EduHub API — http://localhost:${PORT}`);
    console.log(`   POST  /api/auth/login`);
    console.log(`   GET   /api/health`);
    console.log(`   GET   /api/noticias/destacadas`);
    console.log(`   GET   /api/reportes/dashboard\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`El puerto ${PORT} ya está en uso. Cierra el proceso actual o define PORT con otro valor.`);
      process.exit(1);
    }
    throw err;
  });
}

start();
