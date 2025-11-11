import mongoose from "mongoose";

const targetSchema = new mongoose.Schema({
  code: String,
  display: String,
  equivalence: String,
  comment: String,
});

const elementSchema = new mongoose.Schema({
  code: String,
  display: String,
  target: [targetSchema],
});

const groupSchema = new mongoose.Schema({
  source: String,
  target: String,
  element: [elementSchema],
});

const conceptMapSchema = new mongoose.Schema(
  {
    resourceType: { type: String, default: "ConceptMap" },
    url: String,
    name: String,
    title: String,
    status: String,
    sourceUri: String,
    targetUri: String,
    group: [groupSchema],
  },
  { timestamps: true }
);

export default mongoose.model("ConceptMap", conceptMapSchema);
