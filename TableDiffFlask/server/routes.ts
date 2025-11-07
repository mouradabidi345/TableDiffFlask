import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn } from "child_process";
import { comparisonRequestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // POST /api/compare - Compare two Snowflake tables
  app.post("/api/compare", async (req, res) => {
    try {
      // Validate request body
      const validatedData = comparisonRequestSchema.parse(req.body);

      // Spawn Python process to perform comparison
      const pythonProcess = spawn("python3", ["server/table_compare.py"]);

      let resultData = "";
      let errorData = "";

      // Send request data to Python script via stdin
      pythonProcess.stdin.write(JSON.stringify(validatedData));
      pythonProcess.stdin.end();

      // Collect stdout (results)
      pythonProcess.stdout.on("data", (data) => {
        resultData += data.toString();
      });

      // Collect stderr (errors)
      pythonProcess.stderr.on("data", (data) => {
        errorData += data.toString();
      });

      // Handle process completion
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(resultData);
            res.json(result);
          } catch (parseError) {
            console.error("Failed to parse Python output:", parseError);
            res.status(500).json({
              error: "Failed to parse comparison results",
              details: resultData,
            });
          }
        } else {
          console.error("Python process failed:", errorData);
          try {
            const errorResult = JSON.parse(errorData);
            res.status(500).json({
              error: errorResult.error || "Comparison failed",
            });
          } catch {
            res.status(500).json({
              error: "Comparison failed",
              details: errorData || "Unknown error occurred",
            });
          }
        }
      });

      // Handle process errors
      pythonProcess.on("error", (error) => {
        console.error("Failed to start Python process:", error);
        res.status(500).json({
          error: "Failed to start comparison process",
          details: error.message,
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Invalid request data",
          details: error.errors,
        });
      } else {
        console.error("Comparison error:", error);
        res.status(500).json({
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  });

  // POST /api/generate-docx - Generate Word document from comparison results
  app.post("/api/generate-docx", async (req, res) => {
    try {
      // Spawn Python process to generate Word document
      const pythonProcess = spawn("python3", ["server/generate_docx.py"]);

      let resultData = "";
      let errorData = "";

      // Send result data to Python script via stdin
      pythonProcess.stdin.write(JSON.stringify(req.body));
      pythonProcess.stdin.end();

      // Collect stdout (base64 encoded document)
      pythonProcess.stdout.on("data", (data) => {
        resultData += data.toString();
      });

      // Collect stderr (errors)
      pythonProcess.stderr.on("data", (data) => {
        errorData += data.toString();
      });

      // Handle process completion
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(resultData);
            
            // Decode base64 document
            const docBuffer = Buffer.from(result.docx, 'base64');
            
            // Set headers for file download
            const filename = `table-comparison-${new Date().toISOString().slice(0, 10)}.docx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', docBuffer.length);
            
            // Send the document
            res.send(docBuffer);
          } catch (parseError) {
            console.error("Failed to parse Python output:", parseError);
            res.status(500).json({
              error: "Failed to generate Word document",
              details: resultData,
            });
          }
        } else {
          console.error("Python process failed:", errorData);
          try {
            const errorResult = JSON.parse(errorData);
            res.status(500).json({
              error: errorResult.error || "Document generation failed",
            });
          } catch {
            res.status(500).json({
              error: "Document generation failed",
              details: errorData || "Unknown error occurred",
            });
          }
        }
      });

      // Handle process errors
      pythonProcess.on("error", (error) => {
        console.error("Failed to start Python process:", error);
        res.status(500).json({
          error: "Failed to start document generation process",
          details: error.message,
        });
      });
    } catch (error) {
      console.error("Document generation error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
