import mongoose from "mongoose";
import dotenv from "dotenv";
import ConceptMap from "../models/ConceptMap.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/namaste";

async function generateConceptMap() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const mappings = await db.collection("ayurveda_mappings").find().toArray();

    if (!mappings.length) {
      console.log("⚠️ No mappings found in ayurveda_mappings");
      return;
    }

    console.log(`📦 Found ${mappings.length} Ayurveda terminology entries`);

    const groupElements = mappings.map((m) => ({
      code: m.NAMC_CODE || "",
      display: m["Name English"] || m.NAMC_term || "",
      target: [
        {
          code: m.NAMC_term || "",
          display:
            m.NAMC_term_diacritical || m.NAMC_term_DEVANAGARI || "—",
          equivalence: "related",
          comment:
            "Generated from ayurveda_mappings (Sanskrit → English terminology)",
        },
      ],
    }));

    const conceptMap = {
      resourceType: "ConceptMap",
      url: "http://namaste.ai/fhir/ConceptMap/ayurveda-terms",
      name: "AyurvedaTerminology",
      title: "Ayurveda Sanskrit-English Terminology Map",
      status: "active",
      sourceUri: "NAMASTE-AYURVEDA",
      targetUri: "English-Terminology",
      group: [
        {
          source: "NAMASTE-AYURVEDA",
          target: "English",
          element: groupElements,
        },
      ],
    };

    await ConceptMap.deleteMany({});
    await ConceptMap.create(conceptMap);

    console.log("✅ ConceptMap successfully created!");
  } catch (error) {
    console.error("❌ Error generating ConceptMap:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

generateConceptMap();
