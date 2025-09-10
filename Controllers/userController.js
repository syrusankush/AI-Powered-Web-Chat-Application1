// controllers/userController.js
const asyncHandler = require("express-async-handler");
const UserModel = require("../modals/userModel");
const generateToken = require("../Config/generateToken");
const bcrypt = require("bcryptjs");

// 📌 LOGIN user
const loginController = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if ((!name && !email) || !password) {
    res.status(400);
    throw new Error("Please enter username/email and password");
  }

  // Find user by either name or email
  const user = await UserModel.findOne({
    $or: [{ name }, { email }],
  }).select("+password");

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin || false,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid Username/Email or Password");
  }
});

// 📌 REGISTER new user
const registerController = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("All fields are required");
  }

  const userExist = await UserModel.findOne({ email });
  if (userExist) {
    res.status(405);
    throw new Error("User with this email already exists");
  }

  const nameExist = await UserModel.findOne({ name });
  if (nameExist) {
    res.status(406);
    throw new Error("Username already taken");
  }

  // Mongoose schema will hash password automatically
  const user = await UserModel.create({
    name,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin || false,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Failed to register user");
  }
});

// 📌 FETCH all users (except current)
const fetchAllUsersController = asyncHandler(async (req, res) => {
  const search = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await UserModel.find(search)
    .find({ _id: { $ne: req.user._id } }) // exclude self
    .select("_id name email isAdmin");

  res.json(users);
});

module.exports = {
  loginController,
  registerController,
  fetchAllUsersController,
};
