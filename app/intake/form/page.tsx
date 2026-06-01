import { redirect } from "next/navigation";

/** Form wizard defers to chat intake until CC Agent steps are mirrored there. */
export default function IntakeFormPage() {
  redirect("/intake");
}
