import { VirtualSimulator } from "@/features/simulate/components/VirtualSimulator";
import { MemberFeatureGate } from "@/features/auth/components/MemberFeatureGate";

export default function SimulatePage() {
  return (
    <MemberFeatureGate featureLabel="가상 성형 시뮬레이터">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <VirtualSimulator />
      </div>
    </MemberFeatureGate>
  );
}
