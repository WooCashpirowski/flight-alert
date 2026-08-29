import { Plane, WifiOff } from "lucide-react";
import Link from "next/link";
export default function OfflinePage() { return <main className="offline-page"><div className="brand-mark"><Plane size={20} /></div><WifiOff size={32} /><h1>Jesteś offline</h1><p>Twoje alerty nadal działają w chmurze. Wróć, gdy odzyskasz połączenie.</p><Link href="/">Spróbuj ponownie</Link></main>; }