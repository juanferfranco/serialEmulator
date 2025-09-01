const { SerialPort } = require('serialport');
const express = require('express');
const path = require('path');

// ---- CLI simple: --port=COM10 --baud=115200 --hz=10 --pA=0.05 --pB=0.03
const args = Object.fromEntries(process.argv.slice(2).map(s => {
  const [k, v] = s.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));

const PORT = args.port || 'COM10'; 
const BAUD = parseInt(args.baud || '115200', 10);
const HZ   = parseFloat(args.hz   || '10');     // 10 Hz = 100 ms


// Variables de estado globales
let sensorValues = {
  xf: 0,
  yf: 0,
  aState: true,
  bState: false
};

// Servidor web
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/values', (req, res) => {
  res.json(sensorValues);
});

app.post('/api/values', (req, res) => {
  const { xf, yf, aState, bState } = req.body;
  if (xf !== undefined) sensorValues.xf = Math.max(-1200, Math.min(1200, parseFloat(xf)));
  if (yf !== undefined) sensorValues.yf = Math.max(-1200, Math.min(1200, parseFloat(yf)));
  if (aState !== undefined) sensorValues.aState = Boolean(aState);
  if (bState !== undefined) sensorValues.bState = Boolean(bState);
  res.json(sensorValues);
});

app.listen(3000, () => {
  console.log('[WEB] Interfaz disponible en http://localhost:3000');
});

const port = new SerialPort({ path: PORT, baudRate: BAUD });

port.on('open', () => {
  console.log(`[OK] Abierto ${PORT} @ ${BAUD} baud (solo serial).`);
  const period = 1000 / HZ;
  let t = 0;

  const timer = setInterval(() => {
    const boolStr = v => (v ? 'True' : 'False');
    const line = `${sensorValues.xf},${sensorValues.yf},${boolStr(sensorValues.aState)},${boolStr(sensorValues.bState)}\n`;

    port.write(line, err => {
      if (err) console.error('[ERROR write]:', err.message);
    });

    t += 0.15;
  }, period);

  port.on('close', () => {
    clearInterval(timer);
    console.log('[INFO] Puerto cerrado.');
  });
});

port.on('error', err => {
  console.error('[ERROR serial]:', err.message);
  process.exit(1);
});
