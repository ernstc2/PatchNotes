import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { TopicPicker } from "./topic-picker";

export default async function OnboardingTopicsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Branding */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">PatchNotes</h1>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-1">What topics interest you?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Pick the topics you want to follow. You can change these later.
          </p>
          <TopicPicker />
        </div>
      </div>
    </div>
  );
}
