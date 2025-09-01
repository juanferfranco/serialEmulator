const { SerialPort } = require('serialport');

// ---- CLI simple: --port=COM10 --baud=115200 --hz=10 --pA=0.05 --pB=0.03
const args = Object.fromEntries(process.argv.slice(2).map(s => {
  const [k, v] = s.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));

const PORT = args.port || 'COM10';       // el extremo opuesto al que abrirás en p5.js
const BAUD = parseInt(args.baud || '115200', 10);
const HZ   = parseFloat(args.hz   || '10');     // 10 Hz = 100 ms
const pA   = parseFloat(args.pA   || '0.05');   // prob. de conmutar A en cada tick
const pB   = parseFloat(args.pB   || '0.03');   // prob. de conmutar B en cada tick

const port = new SerialPort({ path: PORT, baudRate: BAUD });

port.on('open', () => {
  console.log(`[OK] Abierto ${PORT} @ ${BAUD} baud (solo serial).`);
  const period = 1000 / HZ;
  let t = 0;
  let aState = false;
  let bState = false;

  const timer = setInterval(() => {
    // Acelerómetro sintético ~±1024 con leve ruido
    const x = Math.round(1024 * Math.sin(t) + (Math.random() * 40 - 20));
    const y = Math.round(1024 * Math.cos(t * 0.8) + (Math.random() * 40 - 20));

    // Conmutación pseudoaleatoria de botones
    if (Math.random() < pA) aState = !aState;
    if (Math.random() < pB) bState = !bState;

    const boolStr = v => (v ? 'True' : 'False');
    //const line = `${x},${y},${boolStr(aState)},${boolStr(bState)}\n`;
    
    xf = 0;
    yf = 0;
    aState = true;
    bState = false;
    const line = `${xf},${yf},${boolStr(aState)},${boolStr(bState)}\n`;

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
