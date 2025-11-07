import { z } from "zod";

// Comparison request schema
export const comparisonRequestSchema = z.object({
  // Snowflake credentials (shared for both databases)
  snowflakeUser: z.string().min(1, "Snowflake user is required"),
  snowflakePassword: z.string().min(1, "Snowflake password is required"),
  snowflakeAccount: z.string().min(1, "Snowflake account is required"),
  
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
