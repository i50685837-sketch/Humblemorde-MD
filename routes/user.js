const express = require("express");
const User = require("../models/User");

const router = express.Router();


// GET USER
router.get("/:id", async (req, res) => {

  try {

    const user = await User.findById(
      req.params.id
    ).select("-__v");

    if (!user) {

      return res.status(404).json({
        success: false,
        message: "User not found"
      });

    }

    res.json({
      success: true,
      user
    });

  } catch (error) {

    console.error(
      "User route error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to retrieve user"
    });

  }

});


// CREATE USER
router.post("/", async (req, res) => {

  try {

    const {
      name,
      email,
      phone,
      whatsappNumber
    } = req.body;


    if (!email && !phone) {

      return res.status(400).json({
        success: false,
        message:
          "Email or phone number is required"
      });

    }


    const existingUser =
      await User.findOne({
        $or: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : [])
        ]
      });


    if (existingUser) {

      return res.status(409).json({
        success: false,
        message: "User already exists",
        user: existingUser
      });

    }


    const user = await User.create({

      name,

      email,

      phone,

      whatsappNumber

    });


    res.status(201).json({

      success: true,

      message: "User created",

      user

    });


  } catch (error) {

    console.error(
      "Create user error:",
      error.message
    );

    res.status(500).json({

      success: false,

      message: "Failed to create user"

    });

  }

});


module.exports = router;
