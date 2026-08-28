import { Router } from 'express';
import multer from 'multer';
import { ColumnMapperService } from '../services/columnMapper.service.js';
import { FileParserService } from '../services/fileParser.service.js';
import { SourceType } from '../types/index.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.post('/preview', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }

    const sourceType = (req.body.sourceType || 'MERCHANT').toUpperCase() as SourceType;
    if (!['BANK', 'MERCHANT', 'SETTLEMENT'].includes(sourceType)) {
      return res.status(400).json({ error: 'Invalid source type. Must be BANK, MERCHANT, or SETTLEMENT.' });
    }

    const parsed = FileParserService.parseFile(req.file.buffer, req.file.originalname, sourceType);

    res.json({
      fileName: parsed.fileName,
      fileSize: parsed.fileSize,
      fileType: parsed.fileType,
      headers: parsed.headers,
      totalRows: parsed.totalRows,
      sampleRows: parsed.rows.slice(0, 5),
      mapping: parsed.mapping,
      warnings: parsed.warnings,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to parse uploaded file.' });
  }
});

export default router;
