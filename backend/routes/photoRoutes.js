const express = require('express');
const router  = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { uploadGallery } = require('../middleware/uploadMiddleware');
const { uploadPhotos, getPhotos, updateCaption, deletePhoto } = require('../controllers/photoController');

// Public: anyone can view the gallery
router.get('/:eventId',       optionalAuth, getPhotos);

// Protected: only authenticated users can upload/edit/delete
router.post('/:eventId',      protect, uploadGallery, uploadPhotos);
router.patch('/:id/caption',  protect, updateCaption);
router.delete('/:id',         protect, deletePhoto);

module.exports = router;
