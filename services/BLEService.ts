import { Platform, PermissionsAndroid } from "react-native";
import BleAdvertiser from "react-native-ble-advertiser";
import { BleManager } from "react-native-ble-plx";

export const ATTENDANCE_SERVICE_UUID = "12345678-1234-1234-1234-123456789012";

export interface DiscoveredBeacon {
  deviceId: string;
  sessionCode: string;
  courseCode: string;
  rssi: number;
  lastSeen: number;
}

export async function requestBLEPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  try {
    const result = await PermissionsAndroid.requestMultiple([
      "android.permission.BLUETOOTH_SCAN" as any,
      "android.permission.BLUETOOTH_CONNECT" as any,
      "android.permission.BLUETOOTH_ADVERTISE" as any,
      "android.permission.ACCESS_FINE_LOCATION" as any,
    ]);
    return Object.values(result).every(
      (v) => v === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch {
    return false;
  }
}

export async function startBLEAdvertising(
  sessionCode: string,
  courseCode: string
): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  try {
    BleAdvertiser.setCompanyId(0x004c);

    const codeBytes = sessionCode
      .padEnd(6, " ")
      .slice(0, 6)
      .split("")
      .map((c: string) => c.charCodeAt(0));
    const courseBytes = courseCode
      .padEnd(6, " ")
      .slice(0, 6)
      .split("")
      .map((c: string) => c.charCodeAt(0));

    await BleAdvertiser.broadcast(
      ATTENDANCE_SERVICE_UUID,
      [...codeBytes, ...courseBytes],
      {
        advertiseMode: BleAdvertiser.ADVERTISE_MODE_LOW_LATENCY,
        txPowerLevel: BleAdvertiser.ADVERTISE_TX_POWER_HIGH,
        connectable: false,
        includeDeviceName: false,
        includeTxPowerLevel: false,
      }
    );
    return true;
  } catch (e) {
    console.warn("[BLE] Advertise error:", e);
    return false;
  }
}

export async function stopBLEAdvertising(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await BleAdvertiser.stopBroadcast();
  } catch {}
}

let bleManager: BleManager | null = null;

function getBleManager(): BleManager {
  if (!bleManager) {
    bleManager = new BleManager();
  }
  return bleManager;
}

export async function startBLEScanning(
  onDiscovered: (beacon: DiscoveredBeacon) => void
): Promise<() => void> {
  if (Platform.OS === "web") return () => {};
  try {
    const manager = getBleManager();
    const seen = new Map<string, number>();

    manager.startDeviceScan(
      [ATTENDANCE_SERVICE_UUID],
      { allowDuplicates: true },
      (error, device) => {
        if (error || !device) return;

        const now = Date.now();
        const lastSeen = seen.get(device.id) ?? 0;
        if (now - lastSeen < 2000) return;
        seen.set(device.id, now);

        let sessionCode = "";
        let courseCode = "";

        if (device.manufacturerData) {
          try {
            const decoded = atob(device.manufacturerData);
            const bytes = Array.from(decoded, (c) => c.charCodeAt(0));
            if (bytes.length >= 8) {
              sessionCode = bytes
                .slice(2, 8)
                .map((b) => String.fromCharCode(b))
                .join("")
                .trim();
            }
            if (bytes.length >= 14) {
              courseCode = bytes
                .slice(8, 14)
                .map((b) => String.fromCharCode(b))
                .join("")
                .trim();
            }
          } catch {}
        }

        if (!sessionCode) return;

        onDiscovered({
          deviceId: device.id,
          sessionCode,
          courseCode,
          rssi: device.rssi ?? -99,
          lastSeen: now,
        });
      }
    );

    return () => {
      manager.stopDeviceScan();
    };
  } catch (e) {
    console.warn("[BLE] Scan error:", e);
    return () => {};
  }
}
