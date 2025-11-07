import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { type ComparisonResult } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Database, CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

export default function Results() {
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedResult = sessionStorage.getItem("comparisonResult");
    if (storedResult) {
      setResult(JSON.parse(storedResult));
    } else {
      // No result found, redirect to form
      setLocation("/");
    }
  }, [setLocation]);

  if (!result) {
    return null;
  }

  const handleDownloadText = () => {
    const blob = new Blob([result.fullReport], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `table-comparison-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadWord = async () => {
    setIsGeneratingDocx(true);
    try {
      const response = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Word document');
      }

      // Get the blob from response
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `table-comparison-${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Word document downloaded successfully",
      });
    } catch (error) {
      console.error('Word document generation error:', error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to generate Word document",
      });
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  const matchPercentage = result.summary.totalRows1 > 0
    ? ((result.summary.matchingRows / result.summary.totalRows1) * 100).toFixed(1)
    : "0.0";

  // Get all columns from the difference data
  const getAllColumns = (rows: Record<string, any>[]): string[] => {
    if (rows.length === 0) return [];
    const allCols = new Set<string>();
    rows.forEach(row => Object.keys(row).forEach(col => allCols.add(col)));
    return Array.from(allCols);
  };

  const renderDataTable = (rows: Record<string, any>[], emptyMessage: string) => {
    if (rows.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mb-3 text-green-600" />
          <p className="text-base">{emptyMessage}</p>
        </div>
      );
    }

    const columns = getAllColumns(rows);

    return (
      <div className="border rounded-md">
        <ScrollArea className="h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left font-medium uppercase tracking-wide text-xs text-muted-foreground border-b"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b last:border-b-0 hover-elevate"
                    data-testid={`row-difference-${idx}`}
                  >
                    {columns.map((col) => (
                      <td key={col} className="px-4 py-3 font-mono text-xs text-foreground">
                        {row[col] !== null && row[col] !== undefined
                          ? String(row[col])
                          : <span className="text-muted-foreground italic">null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
        <div className="px-4 py-2 bg-muted/30 border-t text-xs text-muted-foreground">
          Showing {Math.min(rows.length, 100)} of {rows.length} rows
          {rows.length > 100 && " (limited to first 100 for performance)"}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
                <Database className="w-7 h-7 text-primary" />
                Comparison Results
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {result.database1Info} vs {result.database2Info}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Compared on {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                data-testid="button-back-to-form"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                New Comparison
              </Button>
              <Button 
                variant="outline"
                onClick={handleDownloadText} 
                data-testid="button-download-text"
              >
                <Download className="w-4 h-4 mr-2" />
                Download as Text
              </Button>
              <Button 
                onClick={handleDownloadWord} 
                disabled={isGeneratingDocx}
                data-testid="button-download-word"
              >
                <FileText className="w-4 h-4 mr-2" />
                {isGeneratingDocx ? "Generating..." : "Download as Word"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Results */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium">Summary Statistics</CardTitle>
            <CardDescription>
              High-level comparison metrics between the two tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Database 1 Rows
                </p>
                <p className="text-3xl font-semibold text-foreground" data-testid="text-total-rows-1">
                  {result.summary.totalRows1.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Database 2 Rows
                </p>
                <p className="text-3xl font-semibold text-foreground" data-testid="text-total-rows-2">
                  {result.summary.totalRows2.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  Matching Rows
                </p>
                <p className="text-3xl font-semibold text-green-600" data-testid="text-matching-rows">
                  {result.summary.matchingRows.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{matchPercentage}%</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Mismatched
                </p>
                <p className="text-3xl font-semibold text-amber-600" data-testid="text-mismatched-rows">
                  {result.summary.mismatchedRows.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-600" />
                  Only in DB1
                </p>
                <p className="text-3xl font-semibold text-red-600" data-testid="text-only-db1">
                  {result.summary.onlyInDatabase1.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-600" />
                  Only in DB2
                </p>
                <p className="text-3xl font-semibold text-red-600" data-testid="text-only-db2">
                  {result.summary.onlyInDatabase2.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Differences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium">Detailed Differences</CardTitle>
            <CardDescription>
              Explore specific rows and data mismatches between the two tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="only-db1" className="w-full">
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 h-auto">
                <TabsTrigger value="only-db1" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-only-db1">
                  Only in Database 1
                  {result.summary.onlyInDatabase1 > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-xs">
                      {result.summary.onlyInDatabase1}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="only-db2" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-only-db2">
                  Only in Database 2
                  {result.summary.onlyInDatabase2 > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-xs">
                      {result.summary.onlyInDatabase2}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="mismatched" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-mismatched">
                  Mismatched Rows
                  {result.summary.mismatchedRows > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-600 text-white text-xs">
                      {result.summary.mismatchedRows}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="full-report" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-full-report">
                  Full Report
                </TabsTrigger>
              </TabsList>

              <TabsContent value="only-db1" className="mt-6">
                {renderDataTable(
                  result.onlyInDatabase1,
                  "No rows found exclusively in Database 1"
                )}
              </TabsContent>

              <TabsContent value="only-db2" className="mt-6">
                {renderDataTable(
                  result.onlyInDatabase2,
                  "No rows found exclusively in Database 2"
                )}
              </TabsContent>

              <TabsContent value="mismatched" className="mt-6">
                {renderDataTable(
                  result.mismatchedRows,
                  "No mismatched rows found - all matching rows have identical values"
                )}
              </TabsContent>

              <TabsContent value="full-report" className="mt-6">
                <div className="bg-muted/30 rounded-md p-6 border">
                  <pre className="text-sm font-mono whitespace-pre-wrap break-words text-foreground overflow-x-auto" data-testid="text-full-report">
                    {result.fullReport}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Status Message */}
        {result.summary.matchingRows === result.summary.totalRows1 &&
          result.summary.totalRows1 === result.summary.totalRows2 &&
          result.summary.mismatchedRows === 0 && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Tables Match Perfectly
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                      All rows and columns are identical between both tables. Migration validation successful.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        {(result.summary.mismatchedRows > 0 ||
          result.summary.onlyInDatabase1 > 0 ||
          result.summary.onlyInDatabase2 > 0) && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    Differences Detected
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                    The tables have differences that need to be reviewed. Check the detailed tabs above for specifics.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
