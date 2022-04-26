const User = require("../models/user");
require("dotenv").config();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.returnUser = async function (req, res) {
  const user = {
    username: req.user.username,
    email: req.user.email,
    isActive: req.user.isActive,
    isAdmin: req.user.isAdmin,
  };

  return res.send(user);
};

exports.updateUser = async function (req, res) {
  let error = false;

  let update = {
    email: req.body.email,
    username: req.body.username,
  };

  if (req.user.email != req.body.email) {
    User.countDocuments({ email: req.body.email }, async function (err, count) {
      if (count > 0) {
        error = true;
        return res.status(400).send("Account with this email already exists.");
      } else {
        update.isActive = false;
        await User.findOneAndUpdate({ _id: req.user._id }, update);

        const newUser = await User.findOne({ _id: req.user._id });
        signToken(res, newUser);
      }
    });
  } else {
    await User.findOneAndUpdate({ _id: req.user._id }, update);

    const newUser = await User.findOne({ _id: req.user._id });
    signToken(res, newUser);
  }
};

exports.sendVerificationEmail = async function (req, res) {
  const url = "http://localhost:8080/user/verify/";
  const suffix = crypto.randomBytes(64).toString("hex");

  try {
    await User.findOneAndUpdate(
      { _id: req.user._id },
      { verificationString: suffix }
    );
  } catch (error) {
    return res.send(error).status(500);
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: req.user.email,
    subject: "Verification Email",
    html:
      "<h1>Email Verification</h1>" +
      "<p>Thank you for joining us! Please verify your email address by clicking on the bottom link.</p><p>" +
      url +
      suffix +
      "</p><p>If this was not your doing, please ignore this email.</p>",
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      return res.send(error).status(500);
    } else {
      return res
        .send("Verification link sent. Please check your email.")
        .status(200);
    }
  });
};

exports.verifyEmail = async function (req, res) {
  const user = await User.findOne({
    verificationString: req.params.verificationString,
  });

  if (!user) {
    return res.status(500).send("Could not find user");
  }

  await User.findOneAndUpdate(
    { _id: user._id },
    { isActive: true, verificationString: null }
  );

  res.status(200).send("Account successfully verified");
};

exports.createUser = async function (req, res) {
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const user = new User({
      email: req.body.email,
      username: req.body.username,
      password: hashedPassword,
      verificationString: crypto.randomBytes(64).toString("hex"),
      isAdmin: false,
      isActive: false,
    });

    User.countDocuments({ email: user.email }, function (err, count) {
      if (count > 0) {
        res.status(400).send("Account with this email already exists");
      } else {
        user.save();
        res.status(201).send("Account successfully registered");
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.authenticateUser = async function (req, res) {
  const user = await User.findOne({ email: req.body.email });
  if (user == null) {
    return res.status(400).send("Invalid E-Mail or password");
  }
  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      signToken(res, user);
    } else {
      res.status(400).send("Invalid E-Mail or password");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
};

exports.authorizeToken = function (req, res) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, userTokenData) => {
    if (err) {
      return res.sendStatus(403);
    }

    res.status(200).send(userTokenData);
  });
};

exports.authenticateToken = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET,
    async (err, userTokenData) => {
      if (err) {
        return res.sendStatus(403);
      }

      try {
        req.user = await User.findOne({ _id: userTokenData._id });
      } catch (err) {
        return res.sendStatus(403);
      }
      next();
    }
  );
};

function signToken(res, user) {
  const userTokenData = {
    _id: user._id,
    email: user.email,
    username: user.username,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
  };

  const accessToken = jwt.sign(userTokenData, process.env.ACCESS_TOKEN_SECRET);

  res.status(200).json({ accessToken: accessToken });
}
