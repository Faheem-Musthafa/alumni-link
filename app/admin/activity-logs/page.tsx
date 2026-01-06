"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Search, 
  FileDown, 
  Activity, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  User
} from "lucide-react";
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-slate-400">Loading activity logs...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const getModernActionColor = (action: AdminAction) => {
    const actionStr = action as string;
    if (actionStr.includes('approve') || actionStr.includes('resolve')) {
      return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" };
    }
    if (actionStr.includes('reject') || actionStr.includes('delete') || actionStr.includes('dismiss')) {
      return { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" };
    }
    if (actionStr.includes('create') || actionStr.includes('add')) {
      return { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" };
    }
    if (actionStr.includes('update') || actionStr.includes('edit')) {
      return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" };
    }
    return { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" };
  };

  return (
    <AdminLayout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Activity Logs</h1>
            </div>
            <p className="text-slate-400">Track all admin actions and system events</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={loadLogs}
              variant="outline"
              className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={handleExport}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Logs", value: logs.length, color: "from-slate-500 to-slate-600" },
            { label: "Today", value: logs.filter(l => {
              const logDate = l.timestamp instanceof Date ? l.timestamp : new Date();
              return logDate.toDateString() === new Date().toDateString();
            }).length, color: "from-indigo-500 to-purple-500" },
            { label: "This Week", value: logs.filter(l => {
              const logDate = l.timestamp instanceof Date ? l.timestamp : new Date();
              const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
              return logDate >= weekAgo;
            }).length, color: "from-blue-500 to-cyan-500" },
            { label: "Unique Admins", value: new Set(logs.map(l => l.adminEmail)).size, color: "from-amber-500 to-orange-500" },
          ].map((stat, index) => (
            <Card key={index} className="p-4 bg-slate-800/30 border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </p>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <Card className="p-4 bg-slate-800/30 border-slate-700/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by admin name, email, or details..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-indigo-500/50"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }}
              className="h-10 px-4 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {getActionDescription(action as AdminAction)}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Activity Timeline */}
        {filteredLogs.length === 0 ? (
          <Card className="p-12 bg-slate-800/30 border-slate-700/50 text-center">
            <Activity className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No activity logs found</p>
            <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <Card className="bg-slate-800/30 border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Activity Timeline</h2>
                <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
                  {filteredLogs.length}
                </Badge>
              </div>
            </div>
            
            <div className="divide-y divide-slate-700/30">
              {paginatedLogs.map((log, index) => {
                const colorConfig = getModernActionColor(log.action);
                return (
                  <div
                    key={log.id || index}
                    className="p-4 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {log.adminName?.charAt(0).toUpperCase() || 'A'}
                        </span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-white font-medium">{log.adminName}</span>
                          <Badge className={`${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}>
                            {getActionDescription(log.action)}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm mb-2">{log.details}</p>
                        {log.targetName && (
                          <p className="text-slate-500 text-xs flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            Target: {log.targetType} - {log.targetName}
                          </p>
                        )}
                        
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                              View metadata
                            </summary>
                            <pre className="mt-2 text-xs text-slate-400 bg-slate-900/50 p-3 rounded-lg overflow-x-auto border border-slate-700/30">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      
                      {/* Timestamp */}
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                          <Clock className="w-3 h-3" />
                          {log.timestamp instanceof Date ? log.timestamp.toLocaleDateString() : new Date().toLocaleDateString()}
                        </div>
                        <div className="text-slate-500 text-xs mt-0.5">
                          {log.timestamp instanceof Date ? log.timestamp.toLocaleTimeString() : new Date().toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Pagination */}
        {filteredLogs.length > 0 && (
          <Card className="p-4 bg-slate-800/30 border-slate-700/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-400">
                Showing <span className="font-medium text-white">{startIndex + 1}</span> to <span className="font-medium text-white">{Math.min(startIndex + pageSize, filteredLogs.length)}</span> of <span className="font-medium text-white">{filteredLogs.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="h-9 px-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white text-sm"
                >
                  <option value={10}>10 per page</option>
                  <option value={15}>15 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 1}
                    className="bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 text-slate-400 text-sm">{currentPage} / {totalPages || 1}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage >= totalPages}
                    className="bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
