const express = require('express');
const { Pool } = require('pg'); // El driver para conectar con Neon
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Conexión a la base de datos Neon
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_NufOtX40zmKA@ep-restless-wind-an9t9sl9.c-6.us-east-1.aws.neon.tech/neondb?sslmode=requireI', 
  ssl: { rejectUnauthorized: false }
});

// Función para crear la tabla automáticamente si no existe
const prepararBaseDeDatos = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuracion (
        id SERIAL PRIMARY KEY,
        parametro TEXT UNIQUE,
        valor INTEGER
      );
    `);
    // Insertamos el umbral inicial de 30% solo si la tabla está vacía
    await pool.query(`
      INSERT INTO configuracion (parametro, valor) 
      VALUES ('umbral', 30) 
      ON CONFLICT (parametro) DO NOTHING;
    `);
    console.log("✅ Base de datos conectada y lista");
  } catch (err) {
    console.error("❌ Error al preparar la base de datos:", err);
  }
};

prepararBaseDeDatos();

// 1. RUTA PARA LA APP (GET): Ver humedad (por ahora estático en 0)
app.get('/datos-humedad', (req, res) => {
    res.json([{
        id: 1,
        humedad: 0, 
        fecha: new Date().toISOString()
    }]);
});

// 2. RUTA PARA LA APP (POST): Guardar el umbral en Neon
app.post('/configurar-umbral', async (req, res) => {
    const { limite } = req.body;
    try {
        await pool.query('UPDATE configuracion SET valor = $1 WHERE parametro = $2', [limite, 'umbral']);
        console.log(`💾 Guardado en Neon: ${limite}%`);
        res.status(200).send("Guardado con éxito");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al guardar en Neon");
    }
});

app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});
