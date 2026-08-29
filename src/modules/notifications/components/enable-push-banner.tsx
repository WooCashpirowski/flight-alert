"use client";

import { BellRing, Check, LoaderCircle } from "lucide-react";
import { useState } from "react";

function vapidKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) output[index] = raw.charCodeAt(index);
  return output;
}

export function EnablePushBanner() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("Włącz powiadomienia i dowiedz się jako pierwszy.");

  async function enable() {
    setStatus("loading");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("Ta przeglądarka nie obsługuje Web Push.");
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Powiadomienia będą dostępne po konfiguracji VAPID.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Zezwolenie na powiadomienia nie zostało udzielone.");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey(publicKey) });
      const response = await fetch("/api/push/subscription", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
      if (!response.ok) throw new Error("Nie udało się zapisać urządzenia.");
      setStatus("done"); setMessage("Powiadomienia są aktywne na tym urządzeniu.");
    } catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Nie udało się włączyć powiadomień."); }
  }

  return <aside className="push-banner" aria-live="polite"><span className="bell">{status === "done" ? <Check size={18} /> : <BellRing size={18} />}</span><div><strong>{status === "done" ? "Wszystko gotowe" : "Nie przegap spadku ceny"}</strong><p>{message}</p></div><button type="button" disabled={status === "loading" || status === "done"} onClick={enable}>{status === "loading" ? <LoaderCircle className="spin" size={15} /> : status === "done" ? "Włączone" : "Włącz"}</button></aside>;
}