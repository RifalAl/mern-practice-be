const express = require("express");
const { check } = require("express-validator");

const usersController = require("../controllers/user-controller");
const fileUpload = require("../middleware/file-upload")

const router = express.Router();

router.get("/", usersController.getAllUsers);

router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.createUser
);

router.post("/login", usersController.loginUser);

module.exports = router;
