import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema({
  roleName: { type: String, required: true },
  roleNameCode: { type: String, required: true },
  description: { type: String, required: true },
  appId: { type: String, required: true },
  permissions: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add a unique compound index for appId and roleName
RoleSchema.index({ appId: 1, roleName: 1 }, { unique: true });

export default mongoose.models.Roles || mongoose.model('Roles', RoleSchema);