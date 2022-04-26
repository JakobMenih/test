const Phone = require("../models/phone");

const axios = require("axios");
const cheerio = require("cheerio");

const baseUrl = "https://www.gsmarena.com/";

exports.search = async function (req, res) {
  const url = makeUrl(req.body.params);

  try {
    const response = await axios(url);
    var $ = cheerio.load(response.data);
    const phones = [];

    const phonesList = await $(".makers");
    $("ul li", phonesList).each(function () {
      const url = baseUrl + $(this).find("a").attr("href");
      const image = $(this).find("img").attr("src");
      const title = $(this).find("span").html().trim();
      const titleSplit = title.split("<br>");

      const brand = titleSplit[0];
      const model = titleSplit[1];

      const phone = {
        url: url,
        image: image,
        brand: brand,
        model: model,
      };

      phones.push(phone);
    });

    res.send(phones);
  } catch (error) {
    console.log(error);
  }
};

exports.getPhoneDetails = async function (req, res) {
  const url = "https://www.gsmarena.com/" + req.params.phone + ".php";
  let queryResult = null;

  try {
    queryResult = await Phone.findOne({ urlSuffix: req.params.phone });
  } catch (error) {
    console.log(error);
  }

  if (queryResult) {
    await Phone.findOneAndUpdate(
      { _id: queryResult._id },
      { $inc: { visits: 1 } }
    );

    return res.status(200).send(queryResult);
  } else {
    try {
      const response = await axios(url);
      var $ = cheerio.load(response.data);
      let phone = {};

      const info = await $(".article-info");
      const fullname = $(info).find(".specs-phone-name-title").text().trim();
      const brand = fullname.split(" ")[0];
      const model = fullname.split(" ").slice(1).join(" ");
      const image = $(info).find("img").attr("src");

      phone = {
        brand: brand,
        model: model,
        fullname: fullname,
        urlSuffix: req.params.phone,
        image: image,
        specs: [],
      };

      const specsList = await $("#specs-list");
      $("table", specsList).each(function () {
        const specName = $(this)
          .find("th")
          .text()
          .trim()
          .toLowerCase()
          .replace(/ /g, "_");

        const spec = {
          spec: specName,
          subspecs: [],
        };

        $("tr", this).each(function () {
          const subspecName = $(this)
            .find(".ttl")
            .text()
            .trim()
            .toLowerCase()
            .replace(/ /g, "_");

          const attribute = $(this).find(".nfo").text().trim();

          const subspec = {
            subspec: subspecName,
            attribute: attribute,
          };
          if (subspec.attribute) {
            spec.subspecs.push(subspec);
          }
        });
        phone.specs.push(spec);
      });

      const newPhone = new Phone({
        brand: phone.brand,
        model: phone.model,
        fullname: phone.fullname,
        urlSuffix: phone.urlSuffix,
        image: phone.image,
        specs: phone.specs,
        stock: 0,
        price: null,
      });

      await newPhone.save();
      return res.status(200).send(newPhone);
    } catch (error) {
      console.log(error);
    }
  }
};

function makeUrl(params) {
  let url = "https://www.gsmarena.com/results.php3?";

  if (params.brands) {
    let values = params.brands.split(",");
    let newValues = [];

    values.forEach((value) => {
      switch (value) {
        case "Samsung":
          newValues.push(9);
          break;
        case "Huawei":
          newValues.push(58);
          break;
        case "Xiaomi":
          newValues.push(80);
          break;
        case "Apple":
          newValues.push(48);
          break;
        case "OnePlus":
          newValues.push(95);
          break;
        case "OPPO":
          newValues.push(82);
          break;
        case "LG":
          newValues.push(20);
          break;
        case "HTC":
          newValues.push(45);
          break;
        default:
          break;
      }
    });
    url += "sMakers=" + newValues + "&";
  }
  if (params.yearMin) {
    url += "nYearMin=" + params.yearMin + "&";
  }
  if (params.yearMax) {
    url += "nYearMax=" + params.yearMax + "&";
  }
  if (params.priceMin) {
    url += "nPriceMin=" + params.priceMin + "&";
  }
  if (params.priceMax) {
    url += "nPriceMax=" + params.priceMax + "&";
  }
  if (params.os) {
    let values = params.os.split(",");
    let newValues = [];

    values.forEach((value) => {
      switch (value) {
        case "Android":
          newValues.push(2);
          break;
        case "iOS":
          newValues.push(3);
          break;
        case "Windows":
          newValues.push(4);
          break;
        default:
          break;
      }
    });
    url += "sOSes=" + newValues + "&";
  }
  if (params.fiveg) {
    url += "s5Gs=" + 0 + "&";
  }
  if (params.cpuMin) {
    url += "nCpuMHzMin=" + params.cpuMin + "&";
  }
  if (params.cpuMax) {
    url += "nCpuMHzMax=" + params.cpuMax + "&";
  }
  if (params.cpuCoresMin) {
    url += "nCpuCoresMin=" + params.cpuCoresMin + "&";
  }
  if (params.cpuCoresMax) {
    url += "nCpuCoresMax=" + params.cpuCoresMax + "&";
  }
  if (params.ramMin) {
    url += "nRamMin=" + params.ramMin * 1000 + "&";
  }
  if (params.ramMax) {
    url += "nRamMax=" + params.ramMax * 1000 + "&";
  }
  if (params.storageMin) {
    url += "nIntMemMin=" + params.storageMin * 1000 + "&";
  }
  if (params.storageMax) {
    url += "nIntMemMax=" + params.storageMax * 1000 + "&";
  }
  if (params.resolution) {
    const height = parseInt(params.resolution.split("x")[0]);
    const width = parseInt(params.resolution.split("x")[1]);

    url += "nDisplayResMin=" + height * width + "&";
    url += "nDisplayResMax=" + height * width + "&";
  }
  if (params.order && params.order != "Popularity") {
    let index;

    switch (params.order) {
      case "Price":
        index = 1;
        break;
      case "Weight":
        index = 2;
        break;
      case "Camera resolution":
        index = 3;
        break;
      case "Battery capacity":
        index = 4;
        break;
      default:
        break;
    }
    url += "nOrder=" + index + "&";
  }

  if (url.slice(-1) == "&") {
    return url.slice(0, -1);
  } else {
    return url;
  }
}
