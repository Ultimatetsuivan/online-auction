import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ENV from "../config/env";
import { networkManager } from "../utils/network";

type SocketEventListener = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<SocketEventListener>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isManuallyDisconnected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionCheckInterval: ReturnType<typeof setInterval> | null = null;

  async connect() {
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    // Check network connection
    const isConnected = await networkManager.checkConnection();
    if (!isConnected) {
      console.warn("No network connection. Socket connection delayed.");
      networkManager.showOfflineAlert();
      return;
    }

    try {
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem("token");

      // Initialize socket connection
      this.socket = io(ENV.SOCKET_URL, {
        transports: ["websocket"],
        query: token ? { token } : {},
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 10000,
        forceNew: false,
      });

      this.setupEventListeners();
      this.setupConnectionHandlers();

    } catch (error) {
      console.error("Error connecting to socket:", error);
      this.handleConnectionError(error);
    }
  }

  private setupConnectionHandlers() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✓ Socket connected:", this.socket?.id);
      this.reconnectAttempts = 0;
      
      // Clear any pending reconnect timers
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      // Start connection health check
      this.startConnectionHealthCheck();
      
      this.emit("socketConnected", { connected: true });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("✗ Socket disconnected:", reason);
      this.emit("socketDisconnected", { reason });
      
      // Auto-reconnect unless manually disconnected
      if (!this.isManuallyDisconnected && reason !== "io client disconnect") {
        this.reconnectAttempts++;
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          // Exponential backoff for reconnection
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          this.reconnectTimer = setTimeout(() => {
            this.connect();
          }, delay);
        } else {
          console.error("Max reconnection attempts reached");
          this.emit("socketReconnectFailed", {});
        }
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      this.handleConnectionError(error);
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("✓ Socket reconnected after", attemptNumber, "attempts");
      this.reconnectAttempts = 0;
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("Attempting to reconnect...", attemptNumber);
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("Socket reconnection error:", error);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("Socket reconnection failed after max attempts");
      this.emit("socketReconnectFailed", {});
    });
  }

  private handleConnectionError(error: any) {
    this.emit("socketError", { error: error.message || "Connection failed" });
  }

  disconnect() {
    this.isManuallyDisconnected = true;
    
    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.reconnectAttempts = 0;
      console.log("Socket disconnected manually");
    }
  }

  async reconnect() {
    this.isManuallyDisconnected = false;
    this.disconnect();
    await this.connect();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Bid update event
    this.socket.on("bidUpdate", (product: any) => {
      this.emit("bidUpdate", product);
    });

    // Product update event
    this.socket.on("productUpdate", (product: any) => {
      this.emit("productUpdate", product);
    });

    // Countdown update event
    this.socket.on("countdownUpdate", (data: any) => {
      this.emit("countdownUpdate", data);
    });

    // Auction ended event
    this.socket.on("auctionEnded", (data: any) => {
      this.emit("auctionEnded", data);
    });
  }

  // Subscribe to events
  on(event: string, callback: SocketEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  // Unsubscribe from events
  off(event: string, callback: SocketEventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // Emit events to local listeners
  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Send events to server
  send(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn("Socket not connected. Cannot send event:", event);
    }
  }

  // Start auction countdown
  startAuctionCountdown(productId: string, deadline: string) {
    this.send("startAuctionCountdown", { productId, deadline });
  }

  // Notify product sold
  notifyProductSold(productId: string) {
    this.send("productSold", { productId });
  }

  // Notify bid update
  notifyBidUpdate(product: any) {
    this.send("bidUpdate", product);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  private startConnectionHealthCheck(): void {
    // Clear existing interval
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    // Check connection health every 30 seconds
    this.connectionCheckInterval = setInterval(() => {
      if (this.socket && !this.socket.connected && !this.isManuallyDisconnected) {
        console.log("Socket health check: connection lost, attempting reconnect...");
        this.reconnect();
      }
    }, 30000);
  }

  // Get connection status with details
  getConnectionStatus(): {
    connected: boolean;
    id: string | null;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected(),
      id: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
