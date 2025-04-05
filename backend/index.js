const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pinecone } = require("@pinecone-database/pinecone");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { HfInference } = require("@huggingface/inference");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const hf = new HfInference(process.env.HF_API_KEY);

app.locals.pinecone = pinecone;
app.locals.genAI = genAI;
app.locals.hf = hf;

// Routes
const ragRoutes = require("./routes/rag");
app.use("/api/rag", ragRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});