
const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { 
    registerSchema, 
    loginSchema, 
    forgotPasswordSchema, 
    resetPasswordSchema, 
    updateProfileSchema 
} = require('../validations/authValidation');
const { auth } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.put('/update-profile', auth, validate(updateProfileSchema), authController.updateProfile);
router.post('/logout', auth, authController.logout);

module.exports = router;
