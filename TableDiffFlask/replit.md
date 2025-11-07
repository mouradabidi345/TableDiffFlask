# TableMigrationCheck

## Overview
TableMigrationCheck is a professional web application for comparing database tables during data migration. It helps data engineers validate migration integrity by identifying differences between source and target tables across **Snowflake and SQL Server databases**.

**Purpose**: Ensure data consistency between database tables (Snowflake and/or SQL Server)  
**Goals**: Provide detailed comparison reports with summary statistics and difference detection  
**Current State**: Full-featured implementation supporting Snowflake-to-Snowflake, SQL Server-to-SQL Server, and cross-database comparisons

## Recent Changes
- 2025-11-07: **Added SQL Server Support**
  - Added database type selection for each database (Snowflake or SQL Server)
  - Implemented pymssql connector for SQL Server connectivity
  - Refactored Python comparison script (`table_compare.py`) with database-agnostic architecture
  - Added connection factories for both Snowflake and SQL Server
  - Column name normalization for consistent cross-database comparisons
  - Conditional credential forms based on selected database type
  - Support for all three comparison scenarios:
    - Snowflake ↔ Snowflake
    - SQL Server ↔ SQL Server  
    - Snowflake ↔ SQL Server (cross-database)
  - Updated schema validation with database-type-specific credential requirements

- 2025-11-06: Complete MVP implementation with Material Design UI
  - Material Design frontend with custom floating-label inputs (MaterialInput component)
  - Structured results display with tabbed interface showing:
    - Rows only in Database 1
    - Rows only in Database 2
    - Mismatched rows with column-level differences
    - Full datacompy report
  - Python backend returns structured difference arrays for detailed analysis
  - Fixed toast notification system for proper error handling
  - Fixed JSON serialization for numpy/pandas data types
  - Form validation with Zod schemas
  - Responsive design with Material Design principles
  - **Word document download**: Added professional Word document export with formatted tables and summary statistics
  - Complete end-to-end testing passing

## User Preferences
- Material Design aesthetic for professional data engineering workflows
- Roboto font family for typography
- Clean, information-dense interface with clear visual hierarchy
- Focus on clarity and efficiency over visual flair
- Floating labels on all input fields
- Tabbed interface for organizing large datasets
- Responsive tables with horizontal scrolling for wide data

## Project Architecture

### Frontend (React + TypeScript)
- **Framework**: React with Wouter for routing
- **Styling**: Tailwind CSS with Material Design principles
- **Components**:
  - `material-input.tsx`: Custom input component with floating labels
  - `comparison-form.tsx`: Main form with database type selection and conditional credential inputs
  - `results.tsx`: Tabbed results display with structured data tables, summary statistics, and download functionality
- **State Management**: TanStack Query for API calls and form state with React Hook Form
- **Design System**: Shadcn UI components with custom Material Design enhancements
- **Error Handling**: Toast notifications for user feedback
- **Conditional Rendering**: Dynamic form fields based on selected database types (Snowflake vs SQL Server)

### Backend (Express + Python)
- **API Server**: Express.js (TypeScript)
- **Comparison Engine**: Python script (`table_compare.py`) with database-agnostic architecture:
  - `snowflake-connector-python`: Snowflake database connectivity
  - `pymssql`: SQL Server database connectivity (bundled with FreeTDS)
  - `pandas`: Data manipulation
  - `datacompy`: Table comparison logic
  - `python-docx`: Word document generation
- **API Endpoints**:
  - `POST /api/compare`: Accepts comparison request with database type selection, spawns Python process, returns structured results
  - `POST /api/generate-docx`: Generates Word document from comparison results
- **Data Processing**: 
  - Connection factories for Snowflake and SQL Server databases
  - Query functions that handle database-specific SQL syntax
  - Column name normalization to lowercase for consistent cross-database comparisons
  - Python script converts datacompy output to structured JSON with separate arrays for:
    - Rows only in Database 1
    - Rows only in Database 2
    - Mismatched rows
  - Converts numpy/pandas data types (int64, float64, Timestamp) to JSON-serializable Python types
  - Word document generator creates professionally formatted .docx with tables and statistics

### Data Flow
1. User selects database types (Snowflake and/or SQL Server) for both databases
2. User fills form with appropriate credentials and database details
3. Frontend validates and sends POST request to `/api/compare`
4. Express server spawns Python script with request data
5. Python script:
   - Connects to both databases using appropriate connectors (Snowflake or SQL Server)
   - Executes SQL queries to fetch table data
   - Normalizes column names to lowercase
   - Performs datacompy comparison
   - Returns formatted results with summary statistics
6. Frontend displays results with download option
7. Optional: Email notification sent if configured

### Key Features
- **Material Design UI**: Professional, clean interface with floating-label inputs
- **Dual Database Comparison**: Compare tables across different warehouses, databases, or schemas
- **Flexible Primary Keys**: Support for 1-4 composite primary keys
- **Column Selection**: Choose specific columns or compare all columns (*)
- **SQL Filters**: Apply WHERE clauses to both tables
- **Summary Statistics**: Match percentage, row counts, difference counts displayed in cards
- **Structured Difference Tables**: Tabbed interface showing:
  - Rows only in Database 1 (table view)
  - Rows only in Database 2 (table view)
  - Mismatched rows with all columns (table view)
  - Full text report (raw datacompy output)
- **Download Results**: Export reports in two formats:
  - **Text file**: Plain text datacompy report
  - **Word document**: Professional .docx with formatted tables, summary statistics, and sections
- **Email Notifications**: Optional SMTP email delivery (requires environment configuration)
- **Error Handling**: Toast notifications for backend errors with user-friendly messages
- **Responsive Design**: Mobile-friendly layout with horizontal scrolling tables

## Environment Variables

### Required (User-Provided in Form)
- Snowflake credentials entered by users in the web form
- No server-side secrets required for Snowflake connection

### Optional (Email Notifications)
If email functionality is desired, configure these environment variables:
- `SMTP_HOST`: Email server hostname
- `SMTP_PORT`: Email server port (587 for TLS, 465 for SSL)
- `SMTP_USER`: Email account username
- `SMTP_PASSWORD`: Email account password
- `SMTP_FROM_EMAIL`: Sender email address

## Dependencies

### Frontend
- React, TypeScript, Vite
- Tailwind CSS, Shadcn UI
- TanStack Query, React Hook Form
- Wouter (routing)
- Zod (validation)

### Backend
- Express.js (Node.js)
- Python 3.x
- snowflake-connector-python
- pymssql
- pandas
- datacompy

## Running the Application
The application runs on a single port with Express serving both API and frontend:
- Vite dev server for frontend hot reload
- Express API on `/api/*` routes
- Python comparison script spawned as child process
- Workflow: "Start application" runs `npm run dev`
