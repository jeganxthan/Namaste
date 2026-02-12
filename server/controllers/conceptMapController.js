// ConceptMapController.js
import dotenv from "dotenv";
dotenv.config();

import ConceptMap from "../models/ConceptMap.js";
import ICD11Code from "../models/ICD11Code.js";
import AyurvedaMapping from "../models/AyurvedaMapping.js";
import SiddhaMapping from "../models/SiddhaMapping.js";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// ✅ Use OpenRouter chat completions
const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API || process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_REFERER = process.env.OPENROUTER_REFERER;
const OPENROUTER_TITLE = process.env.OPENROUTER_TITLE;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AYURVEDA_DATA_PATH = path.join(
  __dirname,
  "..",
  "data",
  "namaste_ayurveda_morbidity.json"
);
const SIDDHA_DATA_PATH = path.join(
  __dirname,
  "..",
  "data",
  "namaste_siddha_morbidity.json"
);

let ayurvedaCache = null;
let siddhaCache = null;

const loadAyurvedaData = async () => {
  if (ayurvedaCache) return ayurvedaCache;
  const raw = await fs.readFile(AYURVEDA_DATA_PATH, "utf8");
  ayurvedaCache = JSON.parse(raw);
  return ayurvedaCache;
};

const loadSiddhaData = async () => {
  if (siddhaCache) return siddhaCache;
  const raw = await fs.readFile(SIDDHA_DATA_PATH, "utf8");
  siddhaCache = JSON.parse(raw);
  return siddhaCache;
};

const normalizeText = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const normalizeCode = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const buildDummyDrugInfo = (condition) => ({
  condition,
  drugs: [
    {
      name: "Nisha Amalaki",
      form: "Churna",
      uses: "Supports glucose metabolism and digestion",
      modern_equivalent: "Metformin",
      modern_classification: "Biguanide antidiabetic",
    },
    {
      name: "Triphala",
      form: "Churna",
      uses: "Antioxidant support and metabolic balance",
      modern_equivalent: "Alpha-lipoic acid",
      modern_classification: "Antioxidant adjunct",
    },
    {
      name: "Gudmar",
      form: "Kashaya",
      uses: "Reduces sweet cravings and supports glycemic control",
      modern_equivalent: "Acarbose",
      modern_classification: "Alpha-glucosidase inhibitor",
    },
  ],
});

const withFallbackDrugInfo = async (query) => {
  const result = await fetchDrugInfoFromOpenRouter(query);
  if (result?.structured) return result;
  return {
    source: "Dummy",
    structured: true,
    data: buildDummyDrugInfo(query),
  };
};

/**
 * 🧠 Fetch structured drug/treatment info from OpenRouter
 */
export const fetchDrugInfoFromOpenRouter = async (query) => {
  try {
    if (!OPENROUTER_API_KEY) {
      return {
        source: "OpenRouter",
        structured: false,
        data: [{ message: "OpenRouter API key not configured." }],
      };
    }

    const systemPrompt = `
You are an Ayurveda and Siddha medical expert with biomedical knowledge.

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
    const userPrompt = `Given the condition: "${query}"`;

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    };
    if (OPENROUTER_REFERER) headers["HTTP-Referer"] = OPENROUTER_REFERER;
    if (OPENROUTER_TITLE) headers["X-Title"] = OPENROUTER_TITLE;

    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: OPENROUTER_MODEL,
        messages: [
          { role: "system", content: systemPrompt.trim() },
          { role: "user", content: userPrompt },
        ],
      },
      { headers }
    );

    const text = response?.data?.choices?.[0]?.message?.content?.trim() || "";

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (err) {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return {
          source: "OpenRouter",
          structured: false,
          data: [{ message: "Invalid JSON response." }],
        };
      }
      parsed = JSON.parse(match[0]);
    }

    return {
      source: "OpenRouter",
      structured: true,
      data: parsed,
    };
  } catch (error) {
    console.error("OpenRouter Error:", error.response?.data || error.message);
    return {
      source: "OpenRouter",
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

    // 🪷 Ayurveda lookup (DB)
    const ayurvedaRecord = await AyurvedaMapping.findOne({
      NAMC_CODE: regexSafeCode,
    });

    if (ayurvedaRecord) {
      const term =
        ayurvedaRecord.NAMC_term || ayurvedaRecord["Name English"] || safeCode;
      const openRouterResult = await withFallbackDrugInfo(term);

      return res.status(200).json({
        system: "AYURVEDA",
        ...ayurvedaRecord.toObject(),
        drug_information: openRouterResult.data,
        structured: openRouterResult.structured,
      });
    }

    // 🕉️ Siddha lookup (DB)
    const siddhaRecord = await SiddhaMapping.findOne({
      NAMC_CODE: regexSafeCode,
    });

    if (siddhaRecord) {
      const term =
        siddhaRecord.NAMC_TERM || siddhaRecord.Tamil_term || safeCode;
      const openRouterResult = await withFallbackDrugInfo(term);

      return res.status(200).json({
        system: "SIDDHA",
        ...siddhaRecord.toObject(),
        drug_information: openRouterResult.data,
        structured: openRouterResult.structured,
      });
    }

    // ⚠️ No record found
    // 🔎 Ayurveda lookup (JSON fallback)
    const codeKey = normalizeCode(safeCode);
    const ayurvedaData = await loadAyurvedaData();
    const ayuMatch = ayurvedaData.find(
      (item) => normalizeCode(item?.NAMC_CODE) === codeKey
    );
    if (ayuMatch) {
      const term =
        ayuMatch.NAMC_term || ayuMatch["Name English"] || safeCode;
      const openRouterResult = await withFallbackDrugInfo(term);
      return res.status(200).json({
        system: "AYURVEDA",
        ...ayuMatch,
        drug_information: openRouterResult.data,
        structured: openRouterResult.structured,
        source: openRouterResult.source,
      });
    }

    // 🔎 Siddha lookup (JSON fallback)
    const siddhaData = await loadSiddhaData();
    const siddhaMatch = siddhaData.find(
      (item) => normalizeCode(item?.NAMC_CODE) === codeKey
    );
    if (siddhaMatch) {
      const term =
        siddhaMatch.NAMC_TERM || siddhaMatch.Tamil_term || safeCode;
      const openRouterResult = await withFallbackDrugInfo(term);
      return res.status(200).json({
        system: "SIDDHA",
        ...siddhaMatch,
        drug_information: openRouterResult.data,
        structured: openRouterResult.structured,
        source: openRouterResult.source,
      });
    }

    const fallbackResult = await withFallbackDrugInfo(safeCode);
    return res.status(200).json({
      system: "UNKNOWN",
      NAMC_CODE: safeCode,
      NAMC_term: safeCode,
      "Name English": safeCode,
      Short_definition: "-",
      Long_definition: "-",
      drug_information: fallbackResult.data,
      structured: fallbackResult.structured,
      source: fallbackResult.source,
      message: `No record found for code: ${safeCode}. Returned fallback data.`,
    });
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

    // 🪷 Ayurveda (DB)
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
      const openRouterResult = await withFallbackDrugInfo(term);

      return res.status(200).json({
        system: "AYURVEDA",
        ...ayurvedaRecord.toObject(),
        drug_information: openRouterResult.data,
        structured: openRouterResult.structured,
      });
    }

    // 🕉️ Siddha (DB)
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
      const openRouterResult = await withFallbackDrugInfo(term);

      return res.status(200).json({
        system: "SIDDHA",
        ...siddhaRecord.toObject(),
        drug_information: openRouterResult.data,
        structured: openRouterResult.structured,
      });
    }

    // ⚠️ Not found
    // 🔎 Ayurveda lookup (JSON fallback)
    const needle = normalizeText(safeName);
    const ayurvedaData = await loadAyurvedaData();
    const ayuMatch = ayurvedaData.find((item) => {
      const fields = [
        item?.NAMC_term,
        item?.NAMC_term_diacritical,
        item?.NAMC_term_DEVANAGARI,
        item?.["Name English"],
        item?.Short_definition,
        item?.Long_definition,
      ];
      return fields.some((f) => normalizeText(f).includes(needle));
    });
    if (ayuMatch) {
      const term =
        ayuMatch.NAMC_term || ayuMatch["Name English"] || safeName;
      const openRouterResult = await withFallbackDrugInfo(term);
      return res.status(200).json({
        system: "AYURVEDA",
        ...ayuMatch,
        drug_information: openRouterResult.data,
        structured: openRouterResult.structured,
        source: openRouterResult.source,
      });
    }

    // 🔎 Siddha lookup (JSON fallback)
    const siddhaData = await loadSiddhaData();
    const siddhaMatch = siddhaData.find((item) => {
      const fields = [
        item?.NAMC_TERM,
        item?.Tamil_term,
        item?.Short_definition,
        item?.Long_definition,
      ];
      return fields.some((f) => normalizeText(f).includes(needle));
    });
    if (siddhaMatch) {
      const term =
        siddhaMatch.NAMC_TERM || siddhaMatch.Tamil_term || safeName;
      const openRouterResult = await withFallbackDrugInfo(term);
      return res.status(200).json({
        system: "SIDDHA",
        ...siddhaMatch,
        drug_information: openRouterResult.data,
        structured: openRouterResult.structured,
        source: openRouterResult.source,
      });
    }

    const fallbackResult = await withFallbackDrugInfo(safeName);
    return res.status(200).json({
      system: "UNKNOWN",
      NAMC_term: safeName,
      "Name English": safeName,
      Short_definition: "-",
      Long_definition: "-",
      drug_information: fallbackResult.data,
      structured: fallbackResult.structured,
      source: fallbackResult.source,
      message: `No record found for name: ${safeName}. Returned fallback data.`,
    });
  } catch (err) {
    console.error("❌ Error in translateByName:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🔹 Translate ConceptMap by code or name (single FHIR $translate entrypoint)
 */
export const translate = async (req, res) => {
  const { code, name } = req.query;
  if (code && typeof code === "string" && code.trim() !== "") {
    return translateCode(req, res);
  }
  if (name && typeof name === "string" && name.trim() !== "") {
    return translateByName(req, res);
  }
  return res
    .status(400)
    .json({ error: "Provide either ?code or ?name parameter" });
};
