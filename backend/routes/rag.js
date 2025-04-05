const express = require("express");
const router = express.Router();

// System prompt for Gemini
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

router.post("/", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    // Initialize Hugging Face Inference
    const hf = req.app.locals.hf;

    // Generate query embedding with Mixedbread model (1024 dimensions)
    const embeddingResponse = await hf.featureExtraction({
      model: "mixedbread-ai/mxbai-embed-large-v1",
      inputs: query,
    });
    const queryEmbedding = embeddingResponse; // 1024-dimensional vector

    // Query Pinecone with index 'index-one' and namespace 'financial-summary'
    const index = req.app.locals.pinecone.Index("index-one");
    const queryResponse = await index.namespace("financial-summary").query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
      includeValues: false,
    });

    // Extract context from matches - specifically looking for the 'chunk' field
    const context = queryResponse.matches
      .map((match, index) => {
        // Extract document ID and break it down
        const idParts = match.id.split('-');
        const docName = idParts[0].replace(/_/g, ' ');
        
        // Get the content from the 'chunk' field in metadata
        const content = match.metadata && match.metadata.chunk 
          ? match.metadata.chunk 
          : "No content available";
            
        return `[${index + 1}] ${docName} (Score: ${match.score.toFixed(2)}):\n${content}`;
      })
      .join("\n\n");

    console.log("Context retrieved from Pinecone:", context.substring(0, 300) + "...");
    
    // First, analyze if the query is asking for data that could be visualized
    const genAI = req.app.locals.genAI;
    
    // Use structured output format for Gemini
    const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Generate response with JSON structure
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
            textResponse: {
              type: "STRING",
              description: "The detailed text response to the user query"
            },
            hasVisualizations: {
              type: "BOOLEAN",
              description: "Whether the response contains data that could be visualized"
            },
            visualizations: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  type: {
                    type: "STRING",
                    description: "Type of visualization (bar, line, pie, area, etc.)"
                  },
                  title: {
                    type: "STRING",
                    description: "Title for the chart"
                  },
                  subtitle: {
                    type: "STRING",
                    description: "Optional subtitle for context",
                    nullable: true
                  },
                  xAxisLabel: {
                    type: "STRING",
                    description: "Label for the X axis",
                    nullable: true
                  },
                  yAxisLabel: {
                    type: "STRING",
                    description: "Label for the Y axis",
                    nullable: true
                  },
                  growthRate: {
                    type: "NUMBER",
                    description: "Growth rate percentage if applicable",
                    nullable: true
                  },
                  data: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        name: { type: "STRING" },
                        value: { type: "NUMBER", nullable: true },
                        previousValue: { type: "NUMBER", nullable: true },
                        category: { type: "STRING", nullable: true },
                        color: { type: "STRING", nullable: true }
                      }
                    }
                  },
                  timeSeriesData: {
                    type: "ARRAY",
                    description: "Data points for time series if applicable",
                    items: {
                      type: "OBJECT",
                      properties: {
                        date: { type: "STRING" },
                        value: { type: "NUMBER" }
                      }
                    },
                    nullable: true
                  }
                },
                required: ["type", "title", "data"]
              },
              nullable: true
            }
          },
          required: ["textResponse", "hasVisualizations"]
        }
      }
    });
    
    const responseData = JSON.parse(result.response.text());
    
    res.json(responseData);
  } catch (error) {
    console.error("RAG error:", error);
    res.status(500).json({ error: "Failed to process query", details: error.message });
  }
});

module.exports = router;