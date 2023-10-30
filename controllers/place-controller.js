const fs = require("fs");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Place = require("../models/place");
const User = require("../models/user");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.placeId;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (error) {
    return next(
      new HttpError("Something went wrong, could not find a place", 500)
    );
  }
  if (!place) {
    return next(
      new HttpError("Could not find a place for the provided id", 404)
    );
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.userId;

  let userPlaces;
  try {
    userPlaces = await Place.find({ creator: userId });
  } catch (error) {
    return next(
      new HttpError("Something went wrong, could not find any place", 500)
    );
  }

  // if (!userPlaces[0]) {
  //   return next(
  //     new HttpError("Could not find a places for the provided user id", 404)
  //   );
  // }
  res.json({
    userPlaces: userPlaces.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid input passed, please check your input", 422)
    );
  }

  const { title, description, address, latitude, longitude } = req.body;

  const createdPlace = new Place({
    title,
    description,
    location: {
      lat: latitude,
      long: longitude,
    },
    address,
    image: req.file.path,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (error) {
    console.log(error.message);
    return next(new HttpError("Could not find user for provided id", 404));
  }

  if (!user) {
    return next(new HttpError("Could not find user for provided id", 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    console.log(error.message);
    return next(
      new HttpError("Creating place failed, please try again later", 500)
    );
  }

  res.status(201);
  res.json({ place: createdPlace });
};

const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid input passed, please check your input", 422)
    );
  }
  const placeId = req.params.placeId;
  const { title, description } = req.body;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (error) {
    return next(new HttpError("Something wrong, invalid to get place", 500));
  }

  if (place.creator.toString() !== req.userData.userId) {
    return next(new HttpError("You are not allowed to edit this place", 403));
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (error) {
    console.log(error);
    return next(new HttpError("Something wrong, invalid to update place", 500));
  }

  res.status(200);
  res.json({ place: place.toObject({ getters: true }) });
};

const deletePlaceById = async (req, res, next) => {
  const placeId = req.params.placeId;
  let place;
  try {
    place = await Place.findById(placeId).populate("creator", "-password");
  } catch (error) {
    console.log(error.message);
    return next(
      new HttpError("Something went wrong, could not find a place", 500)
    );
  }

  if (!place) {
    return next(new HttpError("Could not found place", 404));
  }

  if (place.creator.id !== req.userData.userId) {
    return next(new HttpError("You are not allowed to delete this place", 403));
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.deleteOne({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    console.log(error.message);
    return next(
      new HttpError("Something went wrong, could not delete place", 500)
    );
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });
  res.status(200);
  res.json({ message: "Success to delete place!" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlaceById = deletePlaceById;
