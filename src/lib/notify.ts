import { toast } from "sonner";

let lastId: string | number | undefined;

/**
 * Shows a single toast at a time: any active toast is dismissed instantly
 * right before the new one animates in, so notifications never stack or jump.
 */
export function notify(message: string, kind: "success" | "error" = "success") {
  if (lastId !== undefined) {
    toast.dismiss(lastId);
  }
  toast.dismiss();
  lastId = kind === "error" ? toast.error(message) : toast.success(message);
  return lastId;
}
