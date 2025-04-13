import mongoose from 'mongoose';

const OrganizerSchema = new mongoose.Schema({
  appId: { type: String, required: true, default: "1" },
  shortName: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
    geolocation: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
  },
  contactInfo: {
    email: { type: String },
    phone: { type: String },
    website: { type: String },
    facebook: { type: String },
    instagram: { type: String },
    twitter: { type: String },
    youtube: { type: String },
  },
  images: {
    logo: { type: String },
    banner: { type: String },
    profile: { type: String },
  },
  isApproved: { type: Boolean, default: false },
  isEnabled: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  approvalDate: { type: Date },
  masterRegionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "MasteredRegion" }],
  masterDivisionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "MasteredDivision" }],
  masterCityIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "MasteredCity" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Organizers || mongoose.model('Organizers', OrganizerSchema);