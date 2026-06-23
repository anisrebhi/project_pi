const express = require('express');
const router  = express.Router();
const { protect }     = require('../middleware/authMiddleware');
const { uploadGallery } = require('../middleware/uploadMiddleware');
const { uploadPhotos, getPhotos, updateCaption, deletePhoto } = require('../controllers/photoController');

router.use(protect);
router.post('/:eventId',         uploadGallery, uploadPhotos);
router.get('/:eventId',          getPhotos);
router.patch('/:id/caption',     updateCaption);
router.delete('/:id',            deletePhoto);

module.exports = router;
