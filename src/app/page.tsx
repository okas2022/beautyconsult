import { LandingPage } from "@/features/auth/components/LandingPage";
import { AuthLandingRedirect } from "@/features/auth/components/AuthLandingRedirect";

export default function HomePage() {
  return (
    <>
      <AuthLandingRedirect />
      <LandingPage />
    </>
  );
}
