// const axios = require("axios");
// const HttpError = require("../models/http-error");
// const API_KEY = "pk.0e837a813cfc7c1374e7804f6e78820b";
 
// const getCoordsForAddress = async (address) => {
//   const response = await axios.get(
//     `https://us1.locationiq.com/v1/search?key=${API_KEY}&q=${encodeURIComponent(
//       address
//     )}&format=json`
//   );
 
//   const data = response.data[0] || response.data.error;

//   if (!data || data === "Unable to geocode") {
//     const error = new HttpError(
//       "Could not find location for the specified address.",
//       422
//     );
//     return next(error);
//   }
 
//   const coorLat = data.lat;
//   const coorLon = data.lon;
//   const coordinates = {
//     lat: coorLat,
//     lng: coorLon
//   };
 
//   return coordinates;
// }

const getCoordsForAddress = (address) => {
  return {
    lat: "123321",
    long: "123321"
  }
}
 
module.exports = getCoordsForAddress;