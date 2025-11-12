import mongoose from "mongoose";

const AyurvedaMappingSchema = new mongoose.Schema({}, { strict: false });
export default mongoose.model("ayurveda_mappings", AyurvedaMappingSchema);
