const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Variables temporales (luego las conectaremos a Neon)
let ultimaHumedad = 0;
let umbralRiego = 30;

// 1. RUTA PARA LA APP (GET): Para que tu App vea la humedad
app.get('/datos-humedad', (req, res) => {
    res.json([{
        id: 1,
        humedad: ultimaHumedad,
        fecha: new Date().toISOString()
    }]);
});

// 2. RUTA PARA EL ESP32 (POST): Para que el sensor guarde la humedad
app.post('/actualizar-humedad', (req, res) => {
    const { humedad } = req.body;
    ultimaHumedad = humedad;
    console.log(`Nueva humedad recibida: ${humedad}%`);
    res.status(200).send("Dato recibido");
});

// 3. RUTA PARA LA APP (POST): Para que la App cambie el límite
app.post('/configurar-umbral', (req, res) => {
    const { limite } = req.body;
    umbralRiego = limite;
    console.log(`Nuevo umbral configurado: ${limite}%`);
    res.status(200).send("Umbral actualizado");
});

app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
});