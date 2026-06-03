import { Suspense } from "react";

import { ChatIntake } from "@/app/components/ChatIntake";

export default function IntakePage() {
  return (
    <Suspense fallback={null}>
      <ChatIntake variant="chat" />
    </Suspense>
  );
}
