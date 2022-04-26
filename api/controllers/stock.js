const Phone = require("../models/phone");
const Wish = require("../models/wish");
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.getStock = async function (req, res) {
  if (!req.user.isAdmin) {
    return res.status(401).send("Unauthorized request");
  }

  try {
    const phones = await Phone.find({ stock: { $gt: 0 } }).sort({
      stock: -1,
    });

    return res.send(phones);
  } catch (error) {
    return res.status(500).send("error");
  }
};

exports.addStock = async function (req, res) {
  if (!req.user.isAdmin) {
    return res.status(401).send("Unauthorized request");
  }

  const newStock = req.body.products;

  newStock.forEach(async (newProduct) => {
    const phone = await Phone.findOne({ fullname: newProduct.fullname });
    if (!phone) {
      return;
    }
    let wasOutOfStock = false;
    if (phone.stock <= 0) {
      wasOutOfStock = true;
    }

    phone.price = newProduct.price;
    phone.stock += newProduct.quantity;

    await Phone.findOneAndUpdate(
      { _id: phone._id },
      {
        price: phone.price,
        stock: phone.stock,
      }
    );

    if (wasOutOfStock) {
      const wishes = await Wish.find({ phone: phone._id })
        .populate("user")
        .populate("phone");

      wishes.forEach(async (wish) => {
        if (!wish.notified) {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: wish.user.email,
            subject: "MyPhoneStore wished product notification",
            html:
              "<h1>Wished Product</h1>" +
              "<p>Your wished phone " +
              wish.phone.fullname +
              " is back in stock!</p>",
          };

          transporter.sendMail(mailOptions, async function (error, info) {
            if (error) {
              console.log(error);
            } else {
              await Wish.findOneAndUpdate(
                { _id: wish._id },
                { notified: true }
              );
            }
          });
        }
      });
    }
  });

  return res.status(200).send("Successfully added stock.");
};
