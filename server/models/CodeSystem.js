import mongoose from "mongoose";

// 🧩 Each code entry (FHIR "concept")
const conceptSchema = new mongoose.Schema({
  code: { type: String, required: true }, // e.g. AYU002
  display: { type: String, required: true }, // e.g. "Prameha (Diabetes)"
  definition: { type: String }, // short or combined definition
  shortDefinition: { type: String },
  longDefinition: { type: String },
  // 🈁 Multilingual variants (Tamil, Hindi, etc.)
  languageVariants: {
    tamil: { type: String, trim: true },
    hindi: { type: String, trim: true },
    sanskrit: { type: String, trim: true },
  },
  // 🧾 Optional metadata for versioning or source
  version: { type: String, default: "2025-11" },
  source: { type: String, default: "NAMASTE CSV Import" },
});

// 🧱 Full CodeSystem schema (FHIR structure)
const codeSystemSchema = new mongoose.Schema(
  {
    resourceType: { type: String, default: "CodeSystem" },
    url: { type: String, required: true }, // e.g. "https://nrhc.mohfw.gov.in/namaste"
    name: { type: String, required: true }, // e.g. "NAMASTE Terminology - Ayurveda"
    status: { type: String, default: "active" },
    content: { type: String, default: "complete" },
    concept: [conceptSchema],
  },
  { timestamps: true }
);

export default mongoose.model("CodeSystem", codeSystemSchema);
