import { z } from "zod";

// Database type enum
export const databaseTypeSchema = z.enum(["snowflake", "sqlserver"]);
export type DatabaseType = z.infer<typeof databaseTypeSchema>;

// Comparison request schema
export const comparisonRequestSchema = z.object({
  // Database 1 type
  db1Type: databaseTypeSchema.default("snowflake"),
  
  // Database 2 type
  db2Type: databaseTypeSchema.default("snowflake"),
  
  // Snowflake credentials (used when db1Type or db2Type is "snowflake")
  snowflakeUser: z.string().optional(),
  snowflakePassword: z.string().optional(),
  snowflakeAccount: z.string().optional(),
  
  // SQL Server Database 1 credentials (used when db1Type is "sqlserver")
  sqlserver1Host: z.string().optional(),
  sqlserver1Port: z.coerce.number().optional(),
  sqlserver1User: z.string().optional(),
  sqlserver1Password: z.string().optional(),
  
  // SQL Server Database 2 credentials (used when db2Type is "sqlserver")
  sqlserver2Host: z.string().optional(),
  sqlserver2Port: z.coerce.number().optional(),
  sqlserver2User: z.string().optional(),
  sqlserver2Password: z.string().optional(),
  
  // Database 1
  warehouse1: z.string().optional(),
  database1: z.string().min(1, "Database 1 name is required"),
  schema1: z.string().min(1, "Schema 1 name is required"),
  table1: z.string().min(1, "Table 1 name is required"),
  columns1: z.string().default("*"),
  filter1: z.string().optional(),
  
  // Database 2
  warehouse2: z.string().optional(),
  database2: z.string().min(1, "Database 2 name is required"),
  schema2: z.string().min(1, "Schema 2 name is required"),
  table2: z.string().min(1, "Table 2 name is required"),
  columns2: z.string().default("*"),
  filter2: z.string().optional(),
  
  // Primary keys (1-4 keys supported)
  primaryKey1: z.string().min(1, "At least one primary key is required"),
  primaryKey2: z.string().optional(),
  primaryKey3: z.string().optional(),
  primaryKey4: z.string().optional(),
  
  // Email configuration
  emailAddress: z.string().email("Invalid email address").optional().or(z.literal("")),
  sendEmail: z.boolean().default(false),
}).refine((data) => {
  // Validate Snowflake credentials if db1Type or db2Type is snowflake
  if (data.db1Type === "snowflake" || data.db2Type === "snowflake") {
    return data.snowflakeUser && data.snowflakePassword && data.snowflakeAccount;
  }
  return true;
}, {
  message: "Snowflake credentials are required when using Snowflake databases",
  path: ["snowflakeUser"],
}).refine((data) => {
  // Validate SQL Server Database 1 credentials if db1Type is sqlserver
  if (data.db1Type === "sqlserver") {
    return data.sqlserver1Host && data.sqlserver1User && data.sqlserver1Password && data.database1;
  }
  return true;
}, {
  message: "SQL Server Database 1 credentials are required",
  path: ["sqlserver1Host"],
}).refine((data) => {
  // Validate SQL Server Database 2 credentials if db2Type is sqlserver
  if (data.db2Type === "sqlserver") {
    return data.sqlserver2Host && data.sqlserver2User && data.sqlserver2Password && data.database2;
  }
  return true;
}, {
  message: "SQL Server Database 2 credentials are required",
  path: ["sqlserver2Host"],
});

export type ComparisonRequest = z.infer<typeof comparisonRequestSchema>;

// Comparison result schema
export const comparisonResultSchema = z.object({
  timestamp: z.string(),
  database1Info: z.string(),
  database2Info: z.string(),
  summary: z.object({
    totalRows1: z.number(),
    totalRows2: z.number(),
    matchingRows: z.number(),
    mismatchedRows: z.number(),
    onlyInDatabase1: z.number(),
    onlyInDatabase2: z.number(),
    columnsCompared: z.number(),
  }),
  fullReport: z.string(),
  onlyInDatabase1: z.array(z.record(z.any())),
  onlyInDatabase2: z.array(z.record(z.any())),
  mismatchedRows: z.array(z.record(z.any())),
  emailSent: z.boolean().optional(),
});

export type ComparisonResult = z.infer<typeof comparisonResultSchema>;
