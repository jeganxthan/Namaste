import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import connectDb from "./config/db.js";
import conditionsRoutes from "./router/conditionsRoutes.js";
import conceptMapRoutes from "./router/conceptMapRoutes.js";
import authRoutes from "./router/authRoutes.js";
import userRoutes from "./router/userRoutes.js";

connectDb();

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 3000;
app.use("/fhir/conditions", conditionsRoutes);
app.use("/fhir/ConceptMap", conceptMapRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
