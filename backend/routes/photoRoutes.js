const express = require('express');
const router  = express.Router();
<<<<<<< HEAD
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { uploadGallery } = require('../middleware/uploadMiddleware');
const { uploadPhotos, getPhotos, updateCaption, deletePhoto } = require('../controllers/photoController');

// Public: anyone can view the gallery
router.get('/:eventId',       optionalAuth, getPhotos);

// Protected: only authenticated users can upload/edit/delete
router.post('/:eventId',      protect, uploadGallery, uploadPhotos);
router.patch('/:id/caption',  protect, updateCaption);
router.delete('/:id',         protect, deletePhoto);
=======
const { protect }     = require('../middleware/authMiddleware');
const { uploadGallery } = require('../middleware/uploadMiddleware');
const { uploadPhotos, getPhotos, updateCaption, deletePhoto } = require('../controllers/photoController');

router.use(protect);
router.post('/:eventId',         uploadGallery, uploadPhotos);
router.get('/:eventId',          getPhotos);
router.patch('/:id/caption',     updateCaption);
router.delete('/:id',            deletePhoto);
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3

module.exports = router;
