const express = require("express");
const userController = require("../controllers/userController");
const { auth } = require("../middlewares/auth");
const { rbac, checkUserOrAdmin } = require("../middlewares/rbac");

const router = express.Router();

router.get("/", auth, rbac(["admin"]), userController.getUsers);

const addressController = require("../controllers/addressController");
const validate = require("../middlewares/validate");
const { addressSchema } = require("../validations/addressValidation");
const { updateUserSchema } = require("../validations/authValidation");

router.put("/:userId", auth, checkUserOrAdmin, validate(updateUserSchema), userController.updateUser);

router.post("/:userId/addresses", auth, rbac(["admin", "user"]), validate(addressSchema), addressController.addAddress);

router.put(
  "/addresses/:addressId",
  auth,
  rbac(["admin", "user"]),
  validate(addressSchema),
  addressController.updateAddress
);

router.delete("/addresses/:addressId", auth, rbac(["admin", "user"]), addressController.deleteAddress);

module.exports = router;
