const express = require('express');
const router = express.Router();
const {
  getAllModules,
  getModuleById,
  getModuleContent,
  generateModuleContent,
  getFullNotes,
} = require('../controllers/module.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getAllModules);
router.get('/:id', protect, getModuleById);
router.get('/:id/content', protect, getModuleContent);
router.get('/:id/full-notes', protect, getFullNotes);
router.post('/:id/generate-content', protect, generateModuleContent);

module.exports = router;