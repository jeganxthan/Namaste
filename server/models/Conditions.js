import mongoose from "mongoose";

const codingSchema = new mongoose.Schema({
  system: String,
  code: String,
  display: String,
});

const conditionSchema = new mongoose.Schema(
  {
    resourceType: { type: String, default: "Condition" },
    clinicalStatus: String,
    verificationStatus: String,
    category: [String],
    severity: String,
    code: {
      coding: [codingSchema],
      text: String,
    },
    subject: {
      reference: String,
      display: String,
    },
    onsetDateTime: Date,

    // ✅ New field: automatically set based on logged-in user
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Condition", conditionSchema);
