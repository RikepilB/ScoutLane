import { Suspense } from "react";
import { isDevLoginAllowed, isGoogleAuthConfigured } from "@/lib/auth/auth.config";
import { SignInForm } from "./_components/SignInForm";

export default function SignInPage() {
  const showDevLogin = isDevLoginAllowed();
  const googleEnabled = isGoogleAuthConfigured();

  return (
    <Suspense>
      <SignInForm showDevLogin={showDevLogin} googleEnabled={googleEnabled} />
    </Suspense>
  );
}
