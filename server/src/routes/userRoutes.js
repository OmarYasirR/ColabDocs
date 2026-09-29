const express = require('express');
const { searchUsers, getUser, listUsers } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listUsers);   
router.get('/search', searchUsers);
router.get('/:id', getUser);

module.exports = router;