const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 🔌 Conexión a Neon (CORREGIDO)
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_NufOtX40zmKA@ep-restless-wind-an9t9sl9.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

// 🧱 Preparar base de datos
const prepararBaseDeDatos = async () => {
  try {
    // Tabla de sensores
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sensores (
        id SERIAL PRIMARY KEY,
        humedad_suelo FLOAT,
        humedad_aire FLOAT,
        temperatura FLOAT,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla de configuración
    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuracion (
        id SERIAL PRIMARY KEY,
        parametro TEXT UNIQUE,
        valor INTEGER
      );
    `);

    // Insertar umbral si no existe
    await pool.query(`
      INSERT INTO configuracion (parametro, valor)
      VALUES ('umbral', 30)
      ON CONFLICT (parametro) DO NOTHING;
    `);

    console.log("✅ Base de datos lista");
  } catch (err) {
    console.error("❌ Error BD:", err);
  }
};

prepararBaseDeDatos();


// 📡 1. POST → ESP envía datos
app.post('/datos-sensores', async (req, res) => {
  const { humedad_suelo, humedad_aire, temperatura } = req.body;

  try {
    await pool.query(
      'INSERT INTO sensores (humedad_suelo, humedad_aire, temperatura) VALUES ($1, $2, $3)',
      [humedad_suelo, humedad_aire, temperatura]
    );

    console.log("📡 Datos recibidos:", req.body);
    res.status(200).send("Datos guardados");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al guardar");
  }
});


// 📊 2. GET → App obtiene último dato
app.get('/datos-humedad', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sensores ORDER BY fecha DESC LIMIT 1'
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Error al obtener datos");
  }
});


// ⚙️ 3. POST → Cambiar umbral
app.post('/configurar-umbral', async (req, res) => {
  const { limite } = req.body;

  try {
    await pool.query(
      'UPDATE configuracion SET valor = $1 WHERE parametro = $2',
      [limite, 'umbral']
    );

    console.log(`💾 Umbral actualizado: ${limite}`);
    res.status(200).send("Guardado");
  } catch (err) {
    res.status(500).send("Error");
  }
});


// 🚀 Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en puerto ${port}`);
});
