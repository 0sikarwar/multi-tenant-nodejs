const express = require("express");
const userController = require("../controllers/userController");
const { auth } = require("../middlewares/auth");
const { rbac } = require("../middlewares/rbac");

const router = express.Router();

router.get("/", auth, rbac(["admin"]), userController.getUsers);

const addressController = require("../controllers/addressController");
const validate = require("../middlewares/validate");
const { addressSchema } = require("../validations/addressValidation");

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
