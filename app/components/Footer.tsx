"use client";
import { useEffect, useState } from "react";

export default function Footer() {
  const [text, setText] = useState("CadetHours3 © 2025");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.footerText) setText(d.footerText);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="py-3 mt-5 border-top text-center text-muted">
      <small>{text}</small>
    </footer>
  );
}
