# EduHub - Plataforma de Gestión Educativa 🎓

EduHub es una plataforma integral, moderna y dinámica para la gestión educativa que permite la administración eficiente de usuarios, proyectos, tareas y noticias. Diseñada con una interfaz atractiva y fácil de usar, la plataforma facilita la comunicación y organización entre estudiantes, profesores y administradores.

## 👥 Integrantes del Proyecto

| Nombre Completo | Usuario GitHub | Rama Asignada |
|-----------------|----------------|---------------|
| Julian Moreno   | [@HackDevCol](https://github.com/HackDevCol) | `JulianMoreno` |
| Jeisson Palma   | [@Jeiss98](https://github.com/Jeiss98) | `JeissonPalma` |
| Gustavo Gallego | [@GustavoG352](https://github.com/GustavoG352) | `GustavoGallego` |

## ✨ Características Principales

- **Dashboard Especializado:** Paneles dedicados tanto para la Administración como para Estudiantes.
- **Gestión de Usuarios (CRUD):** Control total sobre el registro, edición y eliminación de roles y credenciales.
- **Sistema de Proyectos y Tareas:** Organización ágil y estructurada de las actividades académicas.
- **Noticias en Tiempo Real:** Cartelera de novedades dinámicas alimentadas desde el servidor.
- **Diseño Moderno e Inclusivo:** Interfaz completamente responsive con soporte nativo para **Tema Claro** y **Tema Oscuro**.
- **Gráficos Estadísticos:** Visualización de métricas y estados de avance a través de gráficas interactivas.

## 🛠️ Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3 (Vanilla con variables y diseño fluido), JavaScript (ES6+), Chart.js para gráficos.
- **Backend:** Node.js, Express.js.
- **Base de Datos:** MySQL.
- **Arquitectura:** Cliente-Servidor mediante API RESTful.

## 🚀 Instalación y Uso Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Jeiss98/Eduhub.git
   cd Eduhub
   ```

2. **Configurar la base de datos:**
   - Importar el archivo `database/seed.sql` (o la estructura actual) en tu servidor MySQL.
   - Configurar las credenciales de la base de datos en el servidor Node.

3. **Instalar dependencias del backend:**
   ```bash
   cd backend
   npm install
   ```

4. **Iniciar el servidor backend:**
   ```bash
   npm start
   # o usando nodemon: npm run dev
   ```

5. **Acceder a la aplicación frontend:**
   Abre el archivo `frontend/index.html` usando la extensión **Live Server** de VSCode (asegúrate de levantar el servidor desde la raíz de `frontend` para que las rutas funcionen correctamente).

---
*Hecho con dedicación por el equipo de EduHub.*
