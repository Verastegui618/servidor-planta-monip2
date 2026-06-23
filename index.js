const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 🔐 Conexión a Neon (Usa la variable de entorno DATABASE_URL en Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 🧱 Inicialización y Actualización de la Base de Datos
const initDB = async () => {
  try {
    // Crear tabla si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sensores (
        id SERIAL PRIMARY KEY,
        humedad_suelo FLOAT,
        humedad_aire FLOAT,
        temperatura FLOAT,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Asegurar que existe la columna estado_bomba (Importante para que la App no falle)
    await pool.query(`
      ALTER TABLE sensores ADD COLUMN IF NOT EXISTS estado_bomba TEXT DEFAULT 'APAGADA';
    `);

    console.log("✅ Base de datos sincronizada y lista");
  } catch (err) {
    console.error("❌ Error inicializando DB:", err);
  }
};

initDB();

// 📡 POST → El ESP32 envía datos aquí
app.post('/datos-sensores', async (req, res) => {
  const { humedad_suelo, humedad_aire, temperatura, estado_bomba } = req.body;

  try {
    await pool.query(
      'INSERT INTO sensores (humedad_suelo, humedad_aire, temperatura, estado_bomba) VALUES ($1, $2, $3, $4)',
      [humedad_suelo, humedad_aire, temperatura, estado_bomba || 'APAGADA']
    );
    console.log("📥 Datos recibidos del ESP32");
    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Error al insertar datos:", err);
    res.status(500).send("Error");
  }
});

// 📊 GET → La App obtiene el ÚLTIMO dato (Para el Dashboard/Inicio)
app.get('/datos-humedad', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sensores ORDER BY fecha DESC LIMIT 1'
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en GET /datos-humedad:", err);
    res.status(500).send("Error");
  }
});

// 📈 GET → La App obtiene las ÚLTIMAS 10 HORAS (Para el gráfico de Tendencias)
app.get('/datos-historial', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sensores ORDER BY fecha DESC LIMIT 60'
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en GET /datos-historial:", err);
    res.status(500).send("Error");
  }
});

// 🚀 Iniciar Servidor
app.listen(port, () => {
  console.log(`🚀 Servidor MoniP2 corriendo en puerto ${port}`);
});
