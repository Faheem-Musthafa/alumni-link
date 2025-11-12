"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Activity,
  Users,
  FileCheck,
  Briefcase,
  MessageSquare
} from "lucide-react";
import { collection, getDocs, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface CollectionHealth {
  name: string;
  count: number;
  status: "healthy" | "warning" | "error";
  icon: any;
  lastChecked: Date;
}

export function DatabaseHealthMonitor() {
  const [collections, setCollections] = useState<CollectionHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [overallStatus, setOverallStatus] = useState<"healthy" | "warning" | "error">("healthy");

  const collectionConfigs = [
    { name: "users", icon: Users, label: "Users" },
    { name: "verificationRequests", icon: FileCheck, label: "Verifications" },
    { name: "jobs", icon: Briefcase, label: "Job Posts" },
    { name: "mentorshipRequests", icon: MessageSquare, label: "Mentorships" },
    { name: "userReports", icon: AlertCircle, label: "Reports" },
    { name: "adminActivityLogs", icon: Activity, label: "Activity Logs" },
  ];

  const checkDatabaseHealth = async () => {
    setLoading(true);
    try {
      if (!db) throw new Error("Firestore not initialized");

      const healthData: CollectionHealth[] = [];
      let hasWarnings = false;
      let hasErrors = false;

      for (const config of collectionConfigs) {
        try {
          const colRef = collection(db, config.name);
          const countSnapshot = await getCountFromServer(colRef);
          const count = countSnapshot.data().count;

          let status: "healthy" | "warning" | "error" = "healthy";
          
          // Define health thresholds
          if (config.name === "users" && count === 0) {
            status = "error";
            hasErrors = true;
          } else if (count === 0) {
            status = "warning";
            hasWarnings = true;
          }

          healthData.push({
            name: config.label,
            count,
            status,
            icon: config.icon,
            lastChecked: new Date(),
          });
        } catch (error) {
          console.error(`Error checking ${config.name}:`, error);
          healthData.push({
            name: config.label,
            count: 0,
            status: "error",
            icon: config.icon,
            lastChecked: new Date(),
          });
          hasErrors = true;
        }
      }

      setCollections(healthData);
      setOverallStatus(hasErrors ? "error" : hasWarnings ? "warning" : "healthy");
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error checking database health:", error);
      setOverallStatus("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDatabaseHealth();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-500 bg-green-500/20 border-green-500/30";
      case "warning":
        return "text-yellow-500 bg-yellow-500/20 border-yellow-500/30";
      case "error":
        return "text-red-500 bg-red-500/20 border-red-500/30";
      default:
        return "text-gray-500 bg-gray-500/20 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card className="p-6 bg-[#1a1f2e] border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-500/20 rounded-full flex items-center justify-center">
            <Database className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Database Health</h3>
            <p className="text-sm text-gray-400">
              Last checked: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className={`${getStatusColor(overallStatus)} border`}>
            <span className="flex items-center gap-1">
              {getStatusIcon(overallStatus)}
              {overallStatus.toUpperCase()}
            </span>
          </Badge>
          
          <Button
            onClick={checkDatabaseHealth}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-gray-700 text-gray-300 hover:bg-[#0f1419]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && collections.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          collections.map((col) => {
            const Icon = col.icon;
            return (
              <div
                key={col.name}
                className="p-4 bg-[#0f1419] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">{col.name}</span>
                  </div>
                  <Badge className={`${getStatusColor(col.status)} border text-xs`}>
                    {getStatusIcon(col.status)}
                  </Badge>
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{col.count}</span>
                  <span className="text-xs text-gray-500">records</span>
                </div>
                
                {col.status === "warning" && (
                  <p className="text-xs text-yellow-500 mt-2">No data found</p>
                )}
                {col.status === "error" && (
                  <p className="text-xs text-red-500 mt-2">Connection error</p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-800">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">
              {collections.reduce((sum, col) => sum + col.count, 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Total Records</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-500">
              {collections.filter(col => col.status === "healthy").length}
            </p>
            <p className="text-xs text-gray-400 mt-1">Healthy</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-500">
              {collections.filter(col => col.status === "warning" || col.status === "error").length}
            </p>
            <p className="text-xs text-gray-400 mt-1">Issues</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
