import ConceptMap from "../models/ConceptMap.js";
import ICD11Code from "../models/ICD11Code.js";
import AyurvedaMapping from "../models/AyurvedaMapping.js";
import SiddhaMapping from "../models/SiddhaMapping.js";

/**
 * 🔹 Get all ConceptMaps
 */
export const getAllConceptMaps = async (req, res) => {
  try {
    const maps = await ConceptMap.find();
    res.status(200).json(maps);
  } catch (err) {
    console.error("❌ Error fetching ConceptMaps:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🔹 Translate ConceptMap by AYUSH Code (FHIR $translate)
 * Example: GET /fhir/ConceptMap/$translate?code=SI-1.7
 * Returns full document from Ayurveda or Siddha collection.
 */
export const translateCode = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string" || code.trim() === "") {
      return res.status(400).json({ error: "Missing or invalid ?code parameter" });
    }

    const safeCode = code.trim();

    // ✅ Escape all regex-sensitive characters safely
    const regexSafeCode = new RegExp(`^${safeCode.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i");

    // 🪷 Search Ayurveda collection first
    const ayurvedaRecord = await import("../models/AyurvedaMapping.js")
      .then((m) => m.default.findOne({ NAMC_CODE: regexSafeCode }));

    if (ayurvedaRecord) {
      return res.status(200).json({
        system: "AYURVEDA",
        ...ayurvedaRecord.toObject(),
      });
    }

    // 🕉️ Then search Siddha collection
    const siddhaRecord = await import("../models/SiddhaMapping.js")
      .then((m) => m.default.findOne({ NAMC_CODE: regexSafeCode }));

    if (siddhaRecord) {
      return res.status(200).json({
        system: "SIDDHA",
        ...siddhaRecord.toObject(),
      });
    }

    // ⚠️ Not found
    return res.status(404).json({ message: `No record found for code: ${safeCode}` });
  } catch (err) {
    console.error("❌ Error in translateCode:", err);
    res.status(500).json({ error: err.message });
  }
};


/**
 * 🔹 Translate ConceptMap by Display Name (FHIR-style)
 * Example: GET /fhir/ConceptMap/$translate?name=Prameha
 * Returns full document from Ayurveda or Siddha collection.
 */
export const translateByName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Missing or invalid ?name parameter" });
    }

    const safeName = name.trim();
    const regex = new RegExp(safeName, "i"); // case-insensitive search

    // 🪷 Ayurveda: Search across multiple possible fields
    const ayurvedaRecord = await AyurvedaMapping.findOne({
      $or: [
        { NAMC_term: regex },
        { NAMC_term_diacritical: regex },
        { NAMC_term_DEVANAGARI: regex },
        { "Name English": regex },
        { "Short_definition": regex },
        { "Long_definition": regex },
      ],
    });

    if (ayurvedaRecord) {
      return res.status(200).json({
        system: "AYURVEDA",
        ...ayurvedaRecord.toObject(),
      });
    }

    // 🕉️ Siddha: Search across name and Tamil fields
    const siddhaRecord = await SiddhaMapping.findOne({
      $or: [
        { NAMC_TERM: regex },
        { Tamil_term: regex },
        { Short_definition: regex },
        { Long_definition: regex },
      ],
    });

    if (siddhaRecord) {
      return res.status(200).json({
        system: "SIDDHA",
        ...siddhaRecord.toObject(),
      });
    }

    // ⚠️ No match found
    return res
      .status(404)
      .json({ message: `No record found for name: ${safeName}` });
  } catch (err) {
    console.error("❌ Error in translateByName:", err);
    res.status(500).json({ error: err.message });
  }
};
