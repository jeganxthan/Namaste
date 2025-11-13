// ConceptMapController.js
import dotenv from "dotenv";
dotenv.config();

import ConceptMap from "../models/ConceptMap.js";
import ICD11Code from "../models/ICD11Code.js";
import AyurvedaMapping from "../models/AyurvedaMapping.js";
import SiddhaMapping from "../models/SiddhaMapping.js";
import axios from "axios";

// ✅ Use a stable model endpoint
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash"; // ✅ Stable for text generation + JSON
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * 🧠 Fetch structured drug/treatment info from Gemini
 */
export const fetchDrugInfoFromGemini = async (query) => {
  try {
    if (!GEMINI_API_KEY) {
      return {
        source: "Gemini",
        structured: false,
        data: [{ message: "Gemini API key not configured." }],
      };
    }

    const prompt = `
You are an Ayurveda and Siddha medical expert with biomedical knowledge.

Given the condition: "${query}"

Return STRICT JSON only in this exact format:

{
  "condition": "string",
  "drugs": [
    {
      "name": "string",
      "form": "string",
      "uses": "string",
      "modern_equivalent": "string", 
      "modern_classification": "string"
    }
  ]
}

Rules:
- Include 3–6 Ayurvedic/Siddha formulations.
- For each formulation, provide the closest modern medical equivalent based on pharmacological action (e.g., hepatoprotective → Silymarin, bile flow → UDCA).
- “modern_equivalent” must be a REAL modern medicine or pharmacological agent.
- NO commentary, NO markdown, ONLY valid JSON.
- If unsure, choose the closest plausible pharmacological class.
`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const text =
      response?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (err) {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return {
          source: "Gemini",
          structured: false,
          data: [{ message: "Invalid Gemini JSON" }],
        };
      }
      parsed = JSON.parse(match[0]);
    }

    return {
      source: "Gemini",
      structured: true,
      data: parsed,
    };
  } catch (error) {
    console.error("Gemini Error:", error.response?.data || error.message);
    return {
      source: "Gemini",
      structured: false,
      data: [{ message: "Error fetching drug information." }],
    };
  }
};

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
 */
export const translateCode = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string" || code.trim() === "") {
      return res
        .status(400)
        .json({ error: "Missing or invalid ?code parameter" });
    }

    const safeCode = code.trim();
    const regexSafeCode = new RegExp(
      `^${safeCode.replace(/[-\\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`,
      "i"
    );

    // 🪷 Ayurveda lookup
    const ayurvedaRecord = await AyurvedaMapping.findOne({
      NAMC_CODE: regexSafeCode,
    });

    if (ayurvedaRecord) {
      const term =
        ayurvedaRecord.NAMC_term || ayurvedaRecord["Name English"] || safeCode;
      const geminiResult = await fetchDrugInfoFromGemini(term);

      return res.status(200).json({
        system: "AYURVEDA",
        ...ayurvedaRecord.toObject(),
        drug_information: geminiResult.data,
        structured: geminiResult.structured,
      });
    }

    // 🕉️ Siddha lookup
    const siddhaRecord = await SiddhaMapping.findOne({
      NAMC_CODE: regexSafeCode,
    });

    if (siddhaRecord) {
      const term =
        siddhaRecord.NAMC_TERM || siddhaRecord.Tamil_term || safeCode;
      const geminiResult = await fetchDrugInfoFromGemini(term);

      return res.status(200).json({
        system: "SIDDHA",
        ...siddhaRecord.toObject(),
        drug_information: geminiResult.data,
        structured: geminiResult.structured,
      });
    }

    // ⚠️ No record found
    return res
      .status(404)
      .json({ message: `No record found for code: ${safeCode}` });
  } catch (err) {
    console.error("❌ Error in translateCode:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🔹 Translate ConceptMap by Display Name (FHIR-style)
 */
export const translateByName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res
        .status(400)
        .json({ error: "Missing or invalid ?name parameter" });
    }

    const safeName = name.trim();
    const regex = new RegExp(safeName, "i");

    // 🪷 Ayurveda
    const ayurvedaRecord = await AyurvedaMapping.findOne({
      $or: [
        { NAMC_term: regex },
        { NAMC_term_diacritical: regex },
        { NAMC_term_DEVANAGARI: regex },
        { "Name English": regex },
        { Short_definition: regex },
        { Long_definition: regex },
      ],
    });

    if (ayurvedaRecord) {
      const term =
        ayurvedaRecord.NAMC_term || ayurvedaRecord["Name English"] || safeName;
      const geminiResult = await fetchDrugInfoFromGemini(term);

      return res.status(200).json({
        system: "AYURVEDA",
        ...ayurvedaRecord.toObject(),
        drug_information: geminiResult.data,
        structured: geminiResult.structured,
      });
    }

    // 🕉️ Siddha
    const siddhaRecord = await SiddhaMapping.findOne({
      $or: [
        { NAMC_TERM: regex },
        { Tamil_term: regex },
        { Short_definition: regex },
        { Long_definition: regex },
      ],
    });

    if (siddhaRecord) {
      const term =
        siddhaRecord.NAMC_TERM || siddhaRecord.Tamil_term || safeName;
      const geminiResult = await fetchDrugInfoFromGemini(term);

      return res.status(200).json({
        system: "SIDDHA",
        ...siddhaRecord.toObject(),
        drug_information: geminiResult.data,
        structured: geminiResult.structured,
      });
    }

    // ⚠️ Not found
    return res
      .status(404)
      .json({ message: `No record found for name: ${safeName}` });
  } catch (err) {
    console.error("❌ Error in translateByName:", err);
    res.status(500).json({ error: err.message });
  }
};
