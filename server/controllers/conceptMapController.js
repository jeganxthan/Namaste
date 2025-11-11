import ConceptMap from "../models/ConceptMap.js";

/**
 * Get all ConceptMaps
 */
export const getAllConceptMaps = async (req, res) => {
  try {
    const maps = await ConceptMap.find();
    res.status(200).json(maps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Translate a code — FHIR $translate operation
 * Example: GET /fhir/ConceptMap/$translate?code=AYU002
 */
/**
 * Search ConceptMaps by display name (FHIR-style)
 * Example: GET /fhir/ConceptMap/search?name=Prameha
 */
export const translateByName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Missing or invalid ?name parameter" });
    }

    const safeName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const maps = await ConceptMap.find({
      "group.element.display": { $regex: safeName, $options: "i" },
    });

    if (!maps.length) {
      return res.status(404).json({ message: `No ConceptMap found for name: ${name}` });
    }

    const matches = [];

    for (const map of maps) {
      for (const group of map.group || []) {
        for (const el of group.element || []) {
          if (el.display?.toLowerCase().includes(name.toLowerCase())) {
            for (const t of el.target || []) {
              matches.push({
                sourceCode: el.code,
                sourceDisplay: el.display,
                targetCode: t.code,
                targetDisplay: t.display,
                equivalence: t.equivalence || "related",
                comment: t.comment || "",
              });
            }
          }
        }
      }
    }

    // 🧹 Remove duplicates (based on sourceCode + targetCode)
    const uniqueMatches = matches.filter(
      (m, i, self) =>
        i ===
        self.findIndex(
          (x) => x.sourceCode === m.sourceCode && x.targetCode === m.targetCode
        )
    );

    if (!uniqueMatches.length) {
      return res.status(404).json({ message: `No target mappings found for name: ${name}` });
    }

    return res.status(200).json({
      resourceType: "Parameters",
      parameter: uniqueMatches.map((m) => ({
        name: "match",
        part: [
          { name: "sourceCode", valueCode: m.sourceCode },
          { name: "sourceDisplay", valueString: m.sourceDisplay },
          { name: "targetCode", valueCode: m.targetCode },
          { name: "targetDisplay", valueString: m.targetDisplay },
          { name: "equivalence", valueCode: m.equivalence },
          { name: "comment", valueString: m.comment },
        ],
      })),
    });
  } catch (err) {
    console.error("❌ Error in translateByName:", err);
    res.status(500).json({ error: err.message });
  }
};



export const translateCode = async (req, res) => {
  try {
    const { code, name } = req.query;
    console.log("🔍 Incoming Query Params:", { code, name });

    if (!code && !name) {
      return res.status(400).json({
        error: "Missing ?code or ?name parameter",
      });
    }

    // 🧠 Build safe, flexible query
    const query = [];
    if (code && typeof code === "string" && code.trim() !== "") {
      const safeCode = code.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // partial, case-insensitive match (instead of ^exact$)
      query.push({ "group.element.code": { $regex: safeCode, $options: "i" } });
    }
    if (name && typeof name === "string" && name.trim() !== "") {
      const safeName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.push({ "group.element.display": { $regex: safeName, $options: "i" } });
    }

    console.log("🧠 Mongo Query:", JSON.stringify({ $or: query }, null, 2));

    const maps = await ConceptMap.find({ $or: query });

    if (!maps.length) {
      console.log("❌ No ConceptMap found for", code || name);
      return res.status(404).json({
        message: `No mapping found for ${code || name}`,
      });
    }

    console.log("✅ Found ConceptMaps:", maps.length);

    const matches = [];

    for (const map of maps) {
      console.log("🧾 Processing ConceptMap ID:", map._id.toString());
      for (const [gIndex, group] of (map.group || []).entries()) {
        console.log(
          `➡️ Group ${gIndex + 1}: ${group.source || "N/A"} → ${
            group.target || "N/A"
          }`
        );
        for (const [eIndex, el] of (group.element || []).entries()) {
          if (!el || !el.code) continue;

          const matchByCode =
            code &&
            el.code.trim().toLowerCase().includes(code.trim().toLowerCase());
          const matchByName =
            name &&
            el.display?.toLowerCase().includes(name.trim().toLowerCase());

          if (matchByCode || matchByName) {
            console.log(`🎯 Matched element [${eIndex}] ->`, el.code, el.display);
            console.log("📍 Target count:", el.target?.length || 0);

            for (const [tIndex, t] of (el.target || []).entries()) {
              console.log(`    ↪️ Target [${tIndex}] ->`, t.code, t.display);
              matches.push({
                sourceCode: el.code,
                sourceDisplay: el.display,
                targetCode: t.code,
                targetDisplay: t.display,
                equivalence: t.equivalence || "related",
                comment: t.comment || "",
              });
            }
          }
        }
      }
    }

    console.log("🧩 Total matches found (before dedup):", matches.length);

    // 🧹 Remove duplicates based on sourceCode + targetCode
    const uniqueMatches = matches.filter(
      (m, index, self) =>
        index ===
        self.findIndex(
          (x) => x.sourceCode === m.sourceCode && x.targetCode === m.targetCode
        )
    );

    console.log("✅ Unique matches:", uniqueMatches.length);

    if (!uniqueMatches.length) {
      console.log("⚠️ No target mapping found for", code || name);
      return res.status(404).json({
        message: `No target mapping found for ${code || name}`,
      });
    }

    console.log("✅ Returning FHIR Parameters response");

    return res.status(200).json({
      resourceType: "Parameters",
      parameter: uniqueMatches.map((m) => ({
        name: "match",
        part: [
          { name: "sourceCode", valueCode: m.sourceCode },
          { name: "sourceDisplay", valueString: m.sourceDisplay },
          { name: "targetCode", valueCode: m.targetCode },
          { name: "targetDisplay", valueString: m.targetDisplay },
          { name: "equivalence", valueCode: m.equivalence },
          { name: "comment", valueString: m.comment },
        ],
      })),
    });
  } catch (err) {
    console.error("❌ Error in translateCode:", err);
    res.status(500).json({ error: err.message });
  }
};
