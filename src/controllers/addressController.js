const createError = require("http-errors");
const authService = require("../services/authService");

const addAddress = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const tenant_id = req.user.tenant_id;
    const address = req.body;

    const addressId = await authService.addAddressForUser(userId, tenant_id, address);
    res.status(201).json({ address_id: addressId });
  } catch (err) {
    next(err);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const updates = req.body;

    const updated = await authService.updateAddressForUser(addressId, updates);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    await authService.deleteAddressForUser(addressId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addAddress,
  updateAddress,
  deleteAddress,
};
