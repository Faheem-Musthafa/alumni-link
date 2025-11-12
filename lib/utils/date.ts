import { Timestamp } from "firebase/firestore";

export function formatDate(date: Date | Timestamp | string | null | undefined): string {
  if (!date) return "N/A";
  
  try {
    let jsDate: Date;
    
    if (date instanceof Timestamp) {
      jsDate = date.toDate();
    } else if (typeof date === "string") {
      jsDate = new Date(date);
    } else {
      jsDate = date;
    }
    
    return jsDate.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}

export function formatDateTime(date: Date | Timestamp | string | null | undefined): string {
  if (!date) return "N/A";
  
  try {
    let jsDate: Date;
    
    if (date instanceof Timestamp) {
      jsDate = date.toDate();
    } else if (typeof date === "string") {
      jsDate = new Date(date);
    } else {
      jsDate = date;
    }
    
    return jsDate.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date time:", error);
    return "Invalid Date";
  }
}

export function formatRelativeTime(date: Date | Timestamp | string | null | undefined): string {
  if (!date) return "N/A";
  
  try {
    let jsDate: Date;
    
    if (date instanceof Timestamp) {
      jsDate = date.toDate();
    } else if (typeof date === "string") {
      jsDate = new Date(date);
    } else {
      jsDate = date;
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - jsDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatDate(jsDate);
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "Invalid Date";
  }
}

export function isToday(date: Date | Timestamp | string): boolean {
  try {
    let jsDate: Date;
    
    if (date instanceof Timestamp) {
      jsDate = date.toDate();
    } else if (typeof date === "string") {
      jsDate = new Date(date);
    } else {
      jsDate = date;
    }
    
    const today = new Date();
    return (
      jsDate.getDate() === today.getDate() &&
      jsDate.getMonth() === today.getMonth() &&
      jsDate.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    return false;
  }
}

export function isYesterday(date: Date | Timestamp | string): boolean {
  try {
    let jsDate: Date;
    
    if (date instanceof Timestamp) {
      jsDate = date.toDate();
    } else if (typeof date === "string") {
      jsDate = new Date(date);
    } else {
      jsDate = date;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return (
      jsDate.getDate() === yesterday.getDate() &&
      jsDate.getMonth() === yesterday.getMonth() &&
      jsDate.getFullYear() === yesterday.getFullYear()
    );
  } catch (error) {
    return false;
  }
}

export function getTimeAgo(date: Date | Timestamp | string | null | undefined): string {
  if (!date) return "N/A";
  
  try {
    let jsDate: Date;
    
    if (date instanceof Timestamp) {
      jsDate = date.toDate();
    } else if (typeof date === "string") {
      jsDate = new Date(date);
    } else {
      jsDate = date;
    }
    
    if (isToday(jsDate)) return "Today";
    if (isYesterday(jsDate)) return "Yesterday";
    
    return formatRelativeTime(jsDate);
  } catch (error) {
    return "Invalid Date";
  }
}
