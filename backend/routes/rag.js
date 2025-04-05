const express = require("express");
const router = express.Router();
const fetch = require("node-fetch"); // Ensure you have node-fetch installed (`npm install node-fetch@2`)

// System prompt for Gemini response generation
const createSystemPrompt = (context) => `
You are an enterprise assistant providing accurate, context-rich answers based on internal data. Use the following retrieved context to answer the query:

CONTEXT:
${context}

APPROACH:
1. Provide a clear, concise answer based on the context.
2. Use bullet points for lists or multiple points.
3. If the context lacks sufficient info, say so and offer general guidance.
4. Maintain a professional, helpful tone.
5. If your response involves any numerical data that could be visualized (e.g., financial metrics over time, departmental comparisons, regional performance), ensure you structure this data clearly.
`;

// Function to query Pinecone and generate response (reused across endpoints)
async function queryNamespaceAndGenerateResponse(req, res, namespace) {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    const hf = req.app.locals.hf;
    const genAI = req.app.locals.genAI;
    const index = req.app.locals.pinecone.Index("index-one");

    // Generate query embedding
    const embeddingResponse = await hf.featureExtraction({
      model: "mixedbread-ai/mxbai-embed-large-v1",
      inputs: query,
    });
    const queryEmbedding = embeddingResponse;

    // Query Pinecone with the specified namespace
    const queryResponse = await index.namespace(namespace).query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
      includeValues: false,
    });

    // Extract context from matches
    const context = queryResponse.matches
      .map((match, index) => {
        const idParts = match.id.split('-');
        const docName = idParts[0].replace(/_/g, ' ');
        const content = match.metadata?.chunk || "No content available";
        return `[${index + 1}] ${docName} (Score: ${match.score.toFixed(2)}):\n${content}`;
      })
      .join("\n\n");

    console.log(`Context retrieved from Pinecone (${namespace}):`, context.substring(0, 300) + "...");

    // Use Gemini to generate response
    const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const structuredPrompt = `
    Analyze the following query and context to determine if visualization would be helpful.
    
    CONTEXT:
    ${context}
    
    QUERY:
    ${query}
    
    INSTRUCTIONS:
    1. First, provide a detailed text response answering the query.
    2. Carefully analyze your response for any data that could be visualized, especially:
       - Growth metrics (increases or decreases as percentages)
       - Time-based trends
       - Comparisons between categories, departments, or regions
       - Financial metrics or KPIs
       - Projections or forecasts
    3. For any visualizable data, extract it in a structured format.
    4. Format numeric values properly (e.g., convert "10%" to 10 as a number).
    5. For growth metrics, include both the current value and historical values when available.
    `;

    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: structuredPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            textResponse: { type: "STRING", description: "The detailed text response to the user query" },
            hasVisualizations: { type: "BOOLEAN", description: "Whether the response contains data that could be visualized" },
            visualizations: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  type: { type: "STRING", description: "Type of visualization (bar, line, pie, area, etc.)" },
                  title: { type: "STRING", description: "Title for the chart" },
                  subtitle: { type: "STRING", description: "Optional subtitle for context", nullable: true },
                  xAxisLabel: { type: "STRING", description: "Label for the X axis", nullable: true },
                  yAxisLabel: { type: "STRING", description: "Label for the Y axis", nullable: true },
                  growthRate: { type: "NUMBER", description: "Growth rate percentage if applicable", nullable: true },
                  data: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        name: { type: "STRING" },
                        value: { type: "NUMBER", nullable: true },
                        previousValue: { type: "NUMBER", nullable: true },
                        category: { type: "STRING", nullable: true },
                        color: { type: "STRING", nullable: true },
                      },
                    },
                  },
                  timeSeriesData: {
                    type: "ARRAY",
                    description: "Data points for time series if applicable",
                    items: { type: "OBJECT", properties: { date: { type: "STRING" }, value: { type: "NUMBER" } } },
                    nullable: true,
                  },
                },
                required: ["type", "title", "data"],
              },
              nullable: true,
            },
          },
          required: ["textResponse", "hasVisualizations"],
        },
      },
    });

    const responseData = JSON.parse(result.response.text());
    res.json(responseData);
  } catch (error) {
    console.error(`RAG error in ${namespace}:`, error);
    res.status(500).json({ error: "Failed to process query", details: error.message });
  }
}

// Root endpoint to classify the query, check access, and route to namespace
router.post("/", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    // Step 1: Check access with the Python backend
    const accessResponse = await fetch("http://localhost:5001/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const accessData = await accessResponse.json();
    if (!accessResponse.ok) {
      throw new Error(accessData.error || "Failed to check access");
    }

    const isApproved = accessData.final_decision.approved;
    console.log(`Access check for query "${query}": ${isApproved ? "Approved" : "Denied"}`);

    if (!isApproved) {
      return res.status(403).json({
        error: "Access denied",
        details: accessData.final_decision.reason,
        accessResponse: accessData,
      });
    }

    // Step 2: Classify the query with Gemini if access is approved
    const genAI = req.app.locals.genAI;
    const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const classificationPrompt = `
    Given the following user query, determine which namespace it most likely pertains to from the following options:
    - annual-report
    - financial-summary
    - legal-doc
    - sales-pitch
    - hr-policies

    QUERY:
    ${query}

    INSTRUCTIONS:
    1. Analyze the query and select the most relevant namespace based on its content.
    2. Return only the namespace name as a string.
    `;

    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: classificationPrompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "text/plain",
      },
    });

    const namespace = result.response.text().trim();
    console.log(`Classified query "${query}" to namespace: ${namespace}`);

    // Step 3: Route to the appropriate endpoint
    const endpointMap = {
      "financial-summary": "/financial-summary",
      "annual-report": "/annual-report",
      "legal-doc": "/legal-doc",
      "sales-pitch": "/sales-pitch",
      "hr-policies": "/hr-policies",
    };

    if (!endpointMap[namespace]) {
      return res.status(400).json({ error: `Invalid namespace determined: ${namespace}` });
    }

    const endpoint = endpointMap[namespace];
    req.url = endpoint; // Modify the request URL
    router.handle(req, res); // Re-handle the request with the new endpoint
  } catch (error) {
    console.error("Error in root endpoint:", error);
    res.status(500).json({ error: "Failed to process request", details: error.message });
  }
});

// Endpoint for financial-summary
router.post("/financial-summary", async (req, res) => {
  await queryNamespaceAndGenerateResponse(req, res, "financial-summary");
});

// Endpoint for annual-report
router.post("/annual-report", async (req, res) => {
  await queryNamespaceAndGenerateResponse(req, res, "annual-report");
});

// Endpoint for legal-doc
router.post("/legal-doc", async (req, res) => {
  await queryNamespaceAndGenerateResponse(req, res, "legal-doc");
});

// Endpoint for sales-pitch
router.post("/sales-pitch", async (req, res) => {
  await queryNamespaceAndGenerateResponse(req, res, "sales-pitch");
});

// Endpoint for hr-policies
router.post("/hr-policies", async (req, res) => {
  await queryNamespaceAndGenerateResponse(req, res, "hr-policies");
});

module.exports = router;