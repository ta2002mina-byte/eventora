import Link from "next/link";
import { Briefcase } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function VendorNotFound() {
  return (
    <main className="container-page py-16">
      <EmptyState
        icon={<Briefcase className="h-6 w-6" />}
        title="Vendor not found"
        description="This vendor may have been removed, or the link is incorrect."
      />
      <div className="mt-6 text-center">
        <Link href="/vendors" className="text-sm font-medium text-purple-700 hover:underline">
          Browse all vendors
        </Link>
      </div>
    </main>
  );
}
