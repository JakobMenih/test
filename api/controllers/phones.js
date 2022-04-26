const phone = require("../models/phone");
const Phone = require("../models/phone");
const Wish = require("../models/wish");

exports.getWishlist = async function (req, res) {
  try {
    const wishes = await Wish.find({ user: req.user._id }).populate("phone");

    let phones = [];

    for (let i = 0; i < wishes.length; i++) {
      phones.push({
        image: wishes[i].phone.image,
        brand: wishes[i].phone.brand,
        model: wishes[i].phone.model,
        url: wishes[i].phone.urlSuffix,
      });
    }

    return res.status(200).send(phones);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

exports.getWishes = async function (req, res) {
  try {
    const phones = await Phone.find({ "wishes.0": { $exists: true } }).sort({
      wishes: -1,
    });

    return res.send(phones);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

exports.checkWish = async function (req, res) {
  if (!req.params.phoneID) {
    return res.status(500);
  }

  const result = await Wish.findOne({
    user: req.user._id,
    phone: req.params.phoneID,
  });

  if (result) {
    return res.json({ wished: true });
  } else {
    return res.json({ wished: false });
  }
};

exports.wishPhone = async function (req, res) {
  if (!req.user.isActive) {
    return res.status(403).send("You must verify your account first");
  }
  if (!req.body.phoneID) {
    return res.status(500);
  }

  const wish = new Wish({
    user: req.user._id,
    phone: req.body.phoneID,
  });

  await wish.save();

  await Phone.findOneAndUpdate(
    { _id: req.body.phoneID },
    { $addToSet: { wishes: wish._id } }
  );

  return res.status(200).send("Added to wishlist");
};

exports.removeWish = async function (req, res) {
  if (!req.user.isActive) {
    return res.status(403).send("You must verify your account first");
  }
  if (!req.params.phoneID) {
    return res.status(500);
  }

  const wish = await Wish.findOne({
    user: req.user._id,
    phone: req.params.phoneID,
  });

  await Phone.findOneAndUpdate(
    { _id: req.body.phoneID },
    {
      $pull: {
        wishes: {
          _id: wish._id,
        },
      },
    }
  );

  await Wish.deleteOne({ _id: wish._id });

  return res.status(200).send("Removed wish");
};
