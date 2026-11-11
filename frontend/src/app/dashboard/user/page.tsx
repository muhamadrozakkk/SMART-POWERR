import { DashboardView } from "@/components/dashboard/DashboardView";
import { UserControls } from "@/components/dashboard/UserControls";

export default function UserDashboardPage() {
  return <><header className="page-heading"><div><h1>Dashboard Pengguna</h1><p>Pantau energi, estimasi biaya, dan batas pemakaian rumah.</p></div></header><UserControls /><DashboardView /></>;
}
