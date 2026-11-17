import { DashboardView } from "@/components/dashboard/DashboardView";
import { UserControls } from "@/components/dashboard/UserControls";
import { PageHeader } from "@/components/common/PageHeader";
import { DeviceRegistrationCard } from "@/components/devices/DeviceRegistrationCard";
import { EnergyRecommendations } from "@/components/dashboard/EnergyRecommendations";

export default function UserDashboardPage() {
  return <><PageHeader title="Dashboard Pengguna" description="Pantau energi, estimasi biaya, dan batas pemakaian rumah." /><div className="user-dashboard-stack"><DeviceRegistrationCard /><UserControls /><DashboardView /><EnergyRecommendations /></div></>;
}
