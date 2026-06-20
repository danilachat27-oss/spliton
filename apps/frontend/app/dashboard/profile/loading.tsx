import { SplitonLoadingView } from "@/components/ui/spliton-loader";

export default function DashboardProfileLoading() {
  return (
    <SplitonLoadingView
      variant="dark"
      size="lg"
      minHeight="min-h-[40vh]"
      labelKey="common.loading.profile"
      className="bg-black"
    />
  );
}