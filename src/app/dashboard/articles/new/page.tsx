import { verifySession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { createBlankDraft } from "../actions";

export default async function NewArticlePage() {
  const session = await verifySession();
  
  if (!session) {
    redirect('/login');
  }

  if (!hasPermission(session.role, "article:create")) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-destructive mb-4">Unauthorized</h1>
        <p>You do not have permission to create articles.</p>
      </div>
    );
  }

  return createBlankDraft();
}
