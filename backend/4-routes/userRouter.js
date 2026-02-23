const express = require("express");
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} = require("../3-controllers/userController");

const router = express.Router();

//GET /users
router.get("/", getAllUsers);

//POST /users
router.post("/", createUser);

//GET /users/:id
router.get("/:id", getUserById);

//PUT /users/:id
router.put("/:id", updateUser);

//DELETE /users/:id
router.delete("/:id", deleteUser);

module.exports = router;