import mongoose from "mongoose";

const SiddhaMappingSchema = new mongoose.Schema({}, { strict: false });
export default mongoose.model("siddha_mappings", SiddhaMappingSchema);
