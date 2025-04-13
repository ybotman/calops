import mongoose from 'mongoose';

// MasteredCountry schema
export const MasteredCountrySchema = new mongoose.Schema({
  appId: { type: String, required: true, default: "1" },
  countryName: { type: String, required: true },
  countryCode: { type: String, required: true },
  active: { type: Boolean, default: true },
});

// MasteredRegion schema
export const MasteredRegionSchema = new mongoose.Schema({
  appId: { type: String, required: true, default: "1" },
  regionName: { type: String, required: true },
  regionCode: { type: String, required: true },
  active: { type: Boolean, default: true },
  masteredCountryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MasteredCountry",
    required: true,
  },
});

// MasteredDivision schema
export const MasteredDivisionSchema = new mongoose.Schema({
  appId: { type: String, required: true, default: "1" },
  divisionName: { type: String, required: true },
  divisionCode: { type: String, required: true },
  active: { type: Boolean, default: true },
  masteredRegionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MasteredRegion",
    required: true,
  },
  states: { type: [String], required: true },
});

// MasteredCity schema
export const MasteredCitySchema = new mongoose.Schema({
  appId: { type: String, required: true, default: "1" },
  cityName: { type: String, required: true },
  cityCode: { type: String, required: true },
  active: { type: Boolean, default: true },
  masteredDivisionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MasteredDivision",
    required: true,
  },
  geolocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
});

// Export models with singleton pattern
export const MasteredCountry = mongoose.models.MasteredCountry || mongoose.model('MasteredCountry', MasteredCountrySchema);
export const MasteredRegion = mongoose.models.MasteredRegion || mongoose.model('MasteredRegion', MasteredRegionSchema);
export const MasteredDivision = mongoose.models.MasteredDivision || mongoose.model('MasteredDivision', MasteredDivisionSchema);
export const MasteredCity = mongoose.models.MasteredCity || mongoose.model('MasteredCity', MasteredCitySchema);