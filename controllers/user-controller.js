const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getAllUsers = async (req, res, next) => {
  let users;

  try {
    users = await User.find({}, "-password");
  } catch (error) {
    console.log(error);
    return next(
      new HttpError("Something went wrong, could not find users", 500)
    );
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const createUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid input passed, please check your input", 422)
    );
  }

  const { name, email, password } = req.body;

  let exsistingUser;
  try {
    exsistingUser = await User.findOne({ email: email });
  } catch (error) {
    return next(
      new HttpError("Signing up failed, please try again later", 500)
    );
  }

  if (exsistingUser) {
    return next(new HttpError("Email already exist, use another email", 422));
  }

  let hashedPassword = "";
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    return next(
      new HttpError("Could not create user, pleas try again later", 500)
    );
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (error) {
    return next(
      new HttpError("Creating user failed, please try again later", 500)
    );
  }

  let token; //create token
  try {
    token = jwt.sign(
      {
        userId: createdUser.id,
        email: createdUser.email,
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (error) {
    return next(
      new HttpError("Creating token failed, please try again later", 500)
    );
  }

  res.status(201);
  res.json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  let identifiedUser;

  try {
    identifiedUser = await User.findOne({ email: email });
  } catch (error) {
    return next(
      new HttpError("Something went wrong, cannot find any email", 500)
    );
  }

  if (!identifiedUser) {
    return next(new HttpError("Invalid User! or wrong password", 401));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, identifiedUser.password);
  } catch (error) {
    return next(
      new HttpError("Could not log you in, please check your credentials", 500)
    );
  }

  if (!isValidPassword) {
    return next(new HttpError("Invalid User! or wrong password", 401));
  }

  let token; //create token
  try {
    token = jwt.sign(
      {
        userId: identifiedUser.id,
        email: identifiedUser.email,
      },
      process.env.JWT_KEY,
      { expiresIn: "30m" }
    );
  } catch (error) {
    return next(
      new HttpError("Login failed, please try again later", 500)
    );
  }

  res.json({ userId: identifiedUser.id, email: identifiedUser.email, token: token });
};

exports.getAllUsers = getAllUsers;
exports.createUser = createUser;
exports.loginUser = loginUser;
