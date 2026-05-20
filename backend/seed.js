const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Usuario } = require('./src/models/mongo/usuario.model.js');
require('dotenv').config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    await Usuario.deleteMany({});
    console.log('Cleared existing users');

    const hashedPassword = await bcrypt.hash('Test1234!', 10);

    const users = [
      {
        nombre: 'Admin',
        apellido: 'Sistema',
        email: 'admin@eduhub.edu.co',
        documento: '1000000001',
        password: hashedPassword,
        rol: 'admin'
      },
      {
        nombre: 'Maria',
        apellido: 'Garcia',
        email: 'mgarcia@eduhub.edu.co',
        documento: '1000000002',
        password: hashedPassword,
        rol: 'docente'
      },
      {
        nombre: 'Andres',
        apellido: 'Lopez',
        email: 'alopez@eduhub.edu.co',
        documento: '1000000003',
        password: hashedPassword,
        rol: 'estudiante'
      }
    ];

    await Usuario.insertMany(users);
    console.log('Seeded users successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
