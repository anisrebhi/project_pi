require("dotenv").config();
const app       = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
