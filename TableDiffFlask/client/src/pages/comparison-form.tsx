import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { comparisonRequestSchema, type ComparisonRequest } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { MaterialInput } from "@/components/ui/material-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type ComparisonResult } from "@shared/schema";
import { useLocation } from "wouter";
import { Database, ArrowRight, Key, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ComparisonForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<ComparisonRequest>({
    resolver: zodResolver(comparisonRequestSchema),
    defaultValues: {
      db1Type: "snowflake",
      db2Type: "snowflake",
      snowflakeUser: "",
      snowflakePassword: "",
      snowflakeAccount: "",
      sqlserver1Host: "",
      sqlserver1Port: undefined,
      sqlserver1User: "",
      sqlserver1Password: "",
      sqlserver2Host: "",
      sqlserver2Port: undefined,
      sqlserver2User: "",
      sqlserver2Password: "",
      warehouse1: "",
      database1: "",
      schema1: "",
      table1: "",
      columns1: "*",
      filter1: "",
      warehouse2: "",
      database2: "",
      schema2: "",
      table2: "",
      columns2: "*",
      filter2: "",
      primaryKey1: "",
      primaryKey2: "",
      primaryKey3: "",
      primaryKey4: "",
      emailAddress: "",
      sendEmail: false,
    },
  });

  const db1Type = form.watch("db1Type");
  const db2Type = form.watch("db2Type");

  const compareMutation = useMutation({
    mutationFn: async (data: ComparisonRequest) => {
      try {
        const response = await apiRequest("POST", "/api/compare", data);
        return await response.json() as ComparisonResult;
      } catch (error) {
        // Parse error message to extract meaningful details
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Try to extract the actual error from the response if it's in JSON format
        if (errorMessage.includes("{")) {
          try {
            const jsonStart = errorMessage.indexOf("{");
            const jsonStr = errorMessage.substring(jsonStart);
            const errorData = JSON.parse(jsonStr);
            if (errorData.error) {
              throw new Error(errorData.error);
            }
          } catch {
            // If parsing fails, throw original error
          }
        }
        throw error;
      }
    },
    onSuccess: (result) => {
      // Store result in sessionStorage for results page
      sessionStorage.setItem("comparisonResult", JSON.stringify(result));
      setLocation("/results");
      
      if (result.emailSent) {
        toast({
          title: "Email Sent",
          description: "Comparison results have been sent to your email address.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Comparison Failed",
        description: error.message || "An error occurred while comparing the tables. Please check your credentials and try again.",
      });
    },
  });

  const onSubmit = (data: ComparisonRequest) => {
    compareMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <Database className="w-7 h-7 text-primary" />
            TableMigrationCheck
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare two database tables (Snowflake and/or SQL Server) to validate data migration integrity
          </p>
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Snowflake Credentials - Only show if either database uses Snowflake */}
            {(db1Type === "snowflake" || db2Type === "snowflake") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-medium flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Snowflake Credentials
                  </CardTitle>
                  <CardDescription>
                    Enter your Snowflake connection details. These credentials will be used to connect to both databases.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="snowflakeUser"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormControl>
                            <MaterialInput
                              {...field}
                              label="User"
                              error={fieldState.error?.message}
                              data-testid="input-snowflake-user"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="snowflakePassword"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormControl>
                            <MaterialInput
                              {...field}
                              type="password"
                              label="Password"
                              error={fieldState.error?.message}
                              data-testid="input-snowflake-password"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="snowflakeAccount"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <MaterialInput
                            {...field}
                            label="Account"
                            error={fieldState.error?.message}
                            data-testid="input-snowflake-account"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Database 1 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-medium flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Database 1 (Source)
                </CardTitle>
                <CardDescription>
                  Configure the first database table for comparison
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="db1Type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Database Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-db1-type">
                            <SelectValue placeholder="Select database type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="snowflake">Snowflake</SelectItem>
                          <SelectItem value="sqlserver">SQL Server</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {db1Type === "sqlserver" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="sqlserver1Host"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormControl>
                            <MaterialInput
                              {...field}
                              label="Server Host"
                              error={fieldState.error?.message}
                              data-testid="input-sqlserver1-host"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sqlserver1Port"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormControl>
                            <MaterialInput
                              {...field}
                              type="number"
                              label="Port"
                              placeholder="1433"
                              error={fieldState.error?.message}
                              data-testid="input-sqlserver1-port"
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sqlserver1User"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormControl>
                            <MaterialInput
                              {...field}
                              label="Username"
                              error={fieldState.error?.message}
                              data-testid="input-sqlserver1-user"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sqlserver1Password"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormControl>
                            <MaterialInput
                              {...field}
                              type="password"
                              label="Password"
                              error={fieldState.error?.message}
                              data-testid="input-sqlserver1-password"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {db1Type === "snowflake" && (
                    <FormField
                      control={form.control}
                      name="warehouse1"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormControl>
                            <MaterialInput
                              {...field}
                              label="Warehouse (Optional)"
                              error={fieldState.error?.message}
                              data-testid="input-warehouse1"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="database1"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <MaterialInput
                            {...field}
                            label="Database"
                            error={fieldState.error?.message}
                            data-testid="input-database1"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="schema1"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <MaterialInput
                            {...field}
                            label="Schema"
                            error={fieldState.error?.message}
                            data-testid="input-schema1"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="table1"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <MaterialInput
                            {...field}
                            label="Table"
                            error={fieldState.error?.message}
                            data-testid="input-table1"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="columns1"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <MaterialInput
                            {...field}
                            label="Columns"
                            error={fieldState.error?.message}
                            data-testid="input-columns1"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="filter1"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <MaterialInput
                            {...field}
                            label="Filter (Optional)"
                            error={fieldState.error?.message}
                            data-testid="input-filter1"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Visual Separator */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-4">
                <div className="h-px w-24 bg-border" />
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
                <div className="h-px w-24 bg-border" />
              </div>
            </div>

            {/* Database 2 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-medium flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Database 2 (Target)
                </CardTitle>
                <CardDescription>
                  Configure the second database table for comparison
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="db2Type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Database Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-db2-type">
                            <SelectValue placeholder="Select database type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="snowflake">Snowflake</SelectItem>
                          <SelectItem value="sqlserver">SQL Server</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {db2Type === "sqlserver" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="sqlserver2Host"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormControl>
                            <MaterialInput
                              {...field}
                              label="Server Host"
                              error={fieldState.error?.message}
                              data-testid="input-sqlserver2-host"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sqlserver2Port"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormControl>
                            <MaterialInput
                              {...field}
                              type="number"
                              label="Port"
                              placeholder="1433"
                              error={fieldState.error?.message}
                              data-testid="input-sqlserver2-port"
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sqlserver2User"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormControl>
                            <MaterialInput
                              {...field}
                              label="Username"
                              error={fieldState.error?.message}
                              data-testid="input-sqlserver2-user"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sqlserver2Password"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormControl>
                            <MaterialInput
                              {...field}
                              type="password"
                              label="Password"
                              error={fieldState.error?.message}
                              data-testid="input-sqlserver2-password"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {db2Type === "snowflake" && (
                    <FormField
                      control={form.control}
                      name="warehouse2"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormControl>
                            <MaterialInput
                              {...field}
                              label="Warehouse (Optional)"
                              error={fieldState.error?.message}
                              data-testid="input-warehouse2"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="database2"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <MaterialInput
                            {...field}
                            label="Database"
                            error={fieldState.error?.message}
                            data-testid="input-database2"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="schema2"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <MaterialInput
                            {...field}
                            label="Schema"
                            error={fieldState.error?.message}
                            data-testid="input-schema2"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="table2"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <MaterialInput
                            {...field}
                            label="Table"
                            error={fieldState.error?.message}
                            data-testid="input-table2"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="columns2"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <MaterialInput
                            {...field}
                            label="Columns"
                            error={fieldState.error?.message}
                            data-testid="input-columns2"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="filter2"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <MaterialInput
                            {...field}
                            label="Filter (Optional)"
                            error={fieldState.error?.message}
                            data-testid="input-filter2"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Primary Keys */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-medium flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Primary Keys
                </CardTitle>
                <CardDescription>
                  Specify the columns used to match rows between tables (1-4 keys supported)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <FormField
                    control={form.control}
                    name="primaryKey1"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <MaterialInput
                            {...field}
                            label="Key 1"
                            error={fieldState.error?.message}
                            data-testid="input-primary-key-1"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primaryKey2"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <MaterialInput
                            {...field}
                            label="Key 2 (Optional)"
                            error={fieldState.error?.message}
                            data-testid="input-primary-key-2"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primaryKey3"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <MaterialInput
                            {...field}
                            label="Key 3 (Optional)"
                            error={fieldState.error?.message}
                            data-testid="input-primary-key-3"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primaryKey4"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <MaterialInput
                            {...field}
                            label="Key 4 (Optional)"
                            error={fieldState.error?.message}
                            data-testid="input-primary-key-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Email Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-medium flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Notification (Optional)
                </CardTitle>
                <CardDescription>
                  Optionally receive comparison results via email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="emailAddress"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <MaterialInput
                          {...field}
                          type="email"
                          label="Email Address"
                          error={fieldState.error?.message}
                          data-testid="input-email"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sendEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-send-email"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <label className="text-sm font-normal cursor-pointer">
                          Send email notification with comparison results
                        </label>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                size="lg"
                className="w-full md:w-auto md:min-w-[300px] h-12 text-base shadow-md hover:shadow-lg transition-shadow"
                disabled={compareMutation.isPending}
                data-testid="button-compare"
              >
                {compareMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Comparing Tables...
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5 mr-2" />
                    Compare Tables
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
