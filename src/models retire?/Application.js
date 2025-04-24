import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
  appId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String, required: true },
  logoUrl: { type: String },
  isActive: { type: Boolean, default: true },
  settings: {
    defaultRegionId: { type: mongoose.Schema.Types.ObjectId, ref: "MasteredRegion" },
    defaultDivisionId: { type: mongoose.Schema.Types.ObjectId, ref: "MasteredDivision" },
    defaultCityId: { type: mongoose.Schema.Types.ObjectId, ref: "MasteredCity" },
    categorySettings: { type: mongoose.Schema.Types.Mixed },
    features: { type: [String], default: [] },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Applications || mongoose.model('Applications', ApplicationSchema);