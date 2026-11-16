import { DashboardView } from "@/components/dashboard/DashboardView";
import { UserControls } from "@/components/dashboard/UserControls";
import { PageHeader } from "@/components/common/PageHeader";

export default function UserDashboardPage() {
  return <><PageHeader title="Dashboard Pengguna" description="Pantau energi, estimasi biaya, dan batas pemakaian rumah." /><UserControls /><DashboardView /></>;
}
