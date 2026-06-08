import jwt from "jsonwebtoken";
import User from "../models/User.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please provide name, email and password",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const exists = await User.findOne({
      email: email.toLowerCase(),
    });

    if (exists) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      avatar: name.charAt(0).toUpperCase(),
    });

    const token = signToken(user._id);

    const safeUser = await User.findById(user._id).select("-password");

    res.status(201).json({
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = signToken(user._id);

    const safeUser = await User.findById(user._id).select("-password");

    res.json({
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

export const me = async (req, res) => {
  res.json({
    user: req.user,
  });
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, password, morningMotivation } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (name !== undefined) {
      user.name = name;
      user.avatar = name.charAt(0).toUpperCase();
    }

    if (email !== undefined) {
      user.email = email.toLowerCase();
    }

    if (password !== undefined) {
      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters",
        });
      }

      user.password = password;
    }

    if (morningMotivation !== undefined) {
      user.morningMotivation = morningMotivation;
    }

    await user.save();

    const safeUser = await User.findById(user._id).select("-password");

    res.json({
      user: safeUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};
