// models/CodeSystem.js
import mongoose from "mongoose";

const conceptSchema = new mongoose.Schema({
  code: String,
  display: String,
  definition: String,
});

const codeSystemSchema = new mongoose.Schema({
  resourceType: { type: String, default: "CodeSystem" },
  url: String,
  name: String,
  status: String,
  content: String,
  concept: [conceptSchema],
});

export default mongoose.model("CodeSystem", codeSystemSchema);
