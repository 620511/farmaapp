const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const { saveFile } = require('../utils/storage');

const router = express.Router();

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) return cb(new Error('Formato de imagem não suportado (use JPG, PNG ou WEBP)'));
    cb(null, true);
  }
});

// Upload de imagem de produto — usado pelo painel da farmácia.
// Usa S3/Supabase Storage automaticamente se as variáveis S3_* estiverem
// configuradas no .env; caso contrário, salva em disco local (bom para dev).
router.post('/', auth(['PHARMACY', 'ADMIN']), upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Envie um arquivo de imagem' });
    const base = process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
    const url = await saveFile(req.file.buffer, req.file.originalname, req.file.mimetype, base);
    res.status(201).json({ url });
  } catch (e) { next(e); }
});

module.exports = router;
