const express = require("express");
const { check } = require("express-validator");

const placessControllers = require("../controllers/place-controller");
const fileUpload = require("../middleware/file-upload")
const checkToken = require("../middleware/check-token")

const router = express.Router();

router.get("/:placeId", placessControllers.getPlaceById);

router.get("/user/:userId", placessControllers.getPlacesByUserId);

router.use(checkToken);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description")
      .isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placessControllers.createPlace
);

router.patch(
  "/:placeId",
  [
    check("title").not().isEmpty(),
    check("description")
      .isLength({ min: 5 })
  ],
  placessControllers.updatePlaceById
);

router.delete("/:placeId", placessControllers.deletePlaceById);

module.exports = router;
