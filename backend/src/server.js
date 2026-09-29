import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get(
  "/api/health",
  (_, res) =>
    res.json({
      ok: true,
      service: "BlockAttend API",
    })
);

app.use("/api/auth", authRoutes);

app.use("/api/attendance", attendanceRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    message: "Server error",
    error: err.message,
  });
});

const port = Number(
  process.env.PORT || 5000
);

app.listen(port, () => {
  console.log(
    `BlockAttend API running at http://localhost:${port}`
  );
});