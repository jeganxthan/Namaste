import mongoose from "mongoose";

const ICD11CodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    display: { type: String },
    definition: { type: String },
    chapter: { type: String },
    parent: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("ICD11Code", ICD11CodeSchema, "icd11_codes");
