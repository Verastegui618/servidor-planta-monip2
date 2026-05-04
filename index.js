const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 🔐 Conexión a Neon (IMPORTANTE: usar variable de entorno)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 🧱 Crear tabla automáticamente
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sensores (
        id SERIAL PRIMARY KEY,
        humedad_suelo FLOAT,
        humedad_aire FLOAT,
        temperatura FLOAT,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Base de datos lista");
  } catch (err) {
    console.error("❌ Error DB:", err);
  }
};

initDB();


// 📡 POST → ESP envía datos
app.post('/datos-sensores', async (req, res) => {
  const { humedad_suelo, humedad_aire, temperatura } = req.body;

  try {
    await pool.query(
      'INSERT INTO sensores (humedad_suelo, humedad_aire, temperatura) VALUES ($1, $2, $3)',
      [humedad_suelo, humedad_aire, temperatura]
    );

    res.status(200).send("OK");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});


// 📊 GET → App obtiene último dato
app.get('/datos-humedad', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sensores ORDER BY fecha DESC LIMIT 1'
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Error");
  }
});


// 🚀 Servidor
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en puerto ${port}`);
});
