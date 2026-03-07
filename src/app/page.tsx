"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { readSession } from "@/app/lib/session";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = readSession();
    if (!session) {
      router.replace("/auth/login");
      return;
    }

    if (session.role === "system_admin") {
      router.replace("/system_admin/Dasboard");
      return;
    }

    router.replace("/pages/Dashboard");
  }, [router]);

  return <main className="centered">Loading payroll workspace...</main>;
}
