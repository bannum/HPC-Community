"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/adminEmails";

export default function ImportWhatsAppLink() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAllowed(isAdminEmail(data.user?.email));
    });
  }, []);

  if (!allowed) return null;

  return (
    <Link
      href="/requirements/import"
      className="border border-pitch/30 text-ink font-semibold px-4 py-2 rounded text-sm"
    >
      Import from WhatsApp
    </Link>
  );
}
