"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Search, Filter, FileDown, Activity } from "lucide-react";
import { 
  getRecentAdminLogs, 
  getActionDescription, 
  getActionColor,
  AdminActivityLog,
  AdminAction 
} from "@/lib/firebase/adminLogs";
import { downloadCSV, formatDateForExport } from "@/lib/utils/exportData";
import { handleError } from "@/lib/utils/error-handling";
import { useToast } from "@/hooks/use-toast";

export default function ActivityLogsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AdminActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("adminAuthenticated");
    if (!isAuthenticated) {
      router.push("/admin/login");
      return;
    }
    loadLogs();
  }, [router]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const activityLogs = await getRecentAdminLogs(100);
      setLogs(activityLogs);
      setFilteredLogs(activityLogs);
    } catch (error) {
      handleError(error, "Failed to load activity logs");
      toast({
        title: "Error",
        description: "Failed to load activity logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = logs;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(log =>
        log.adminName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.targetName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by action type
    if (filterAction !== "all") {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    setFilteredLogs(filtered);
  }, [searchTerm, filterAction, logs]);

  const handleExport = () => {
    try {
      const exportData = filteredLogs.map(log => ({
        timestamp: formatDateForExport(log.timestamp),
        admin: log.adminName,
        email: log.adminEmail,
        action: getActionDescription(log.action),
        target: log.targetType,
        details: log.details,
      }));

      const timestamp = new Date().toISOString().split('T')[0];
      downloadCSV(
        exportData,
        [
          { key: 'timestamp', label: 'Timestamp' },
          { key: 'admin', label: 'Admin' },
          { key: 'email', label: 'Email' },
          { key: 'action', label: 'Action' },
          { key: 'target', label: 'Target Type' },
          { key: 'details', label: 'Details' },
        ],
        `activity-logs-${timestamp}`
      );

      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} activity logs`,
      });
    } catch (error) {
      handleError(error, "Export failed");
      toast({
        title: "Export Failed",
        description: "Failed to export logs",
        variant: "destructive",
      });
    }
  };

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 bg-[#1a1f2e] rounded-xl flex items-center justify-center border border-gray-800">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Activity Logs</h1>
              <p className="text-gray-400 text-sm">Track all admin actions and system events</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              placeholder="Search by admin name, email, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#1a1f2e] border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-[#1a1f2e] border border-gray-800 text-white rounded-lg px-4 py-2 min-w-[200px]"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>
                {getActionDescription(action as AdminAction)}
              </option>
            ))}
          </select>

          <Button
            onClick={handleExport}
            variant="outline"
            className="border-gray-800 text-gray-400 hover:bg-[#1a1f2e]"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button
            onClick={loadLogs}
            variant="outline"
            className="border-gray-800 text-gray-400 hover:bg-[#1a1f2e]"
          >
            Refresh
          </Button>
        </div>

        {/* Logs Table */}
        <Card className="bg-[#1a1f2e] border-gray-800">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Activity Timeline</h2>
                <Badge className="bg-gray-800 text-white border-0 px-3 py-1">
                  {filteredLogs.length}
                </Badge>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No activity logs found
                </div>
              ) : (
                filteredLogs.map((log, index) => (
                  <div
                    key={log.id || index}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-[#0f1419] transition-colors border border-gray-800"
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${getActionColor(log.action).replace('text-', 'bg-')}`} />
                      {index < filteredLogs.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-800 mt-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">{log.adminName}</span>
                            <Badge variant="outline" className={`${getActionColor(log.action)} border-current`}>
                              {getActionDescription(log.action)}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm mb-1">{log.details}</p>
                          {log.targetName && (
                            <p className="text-gray-500 text-xs">
                              Target: {log.targetType} - {log.targetName}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-gray-400 text-xs">
                            {log.timestamp instanceof Date ? log.timestamp.toLocaleDateString() : new Date().toLocaleDateString()}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {log.timestamp instanceof Date ? log.timestamp.toLocaleTimeString() : new Date().toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                            View details
                          </summary>
                          <pre className="mt-2 text-xs text-gray-400 bg-[#0f1419] p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
