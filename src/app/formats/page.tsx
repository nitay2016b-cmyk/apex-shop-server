import { getDb } from "@/lib/store";
import FormatsClient from "./FormatsClient";

export default async function FormatsPage() {
  const db = await getDb();
  const formats = [...db.formats].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">פורמטים</h1>
      <p className="mt-1 text-sm text-zinc-400">
        פורמט הוא ערכת הנחיות שמורה — בדיוק כמו System Instructions ב-AI Studio —
        שה-AI משתמש בה כדי לדעת איך לערוך כל סרטון: יחס תמונה, אורך, טון, כתוביות,
        מוזיקה והנחיות חופשיות.
      </p>

      <FormatsClient initialFormats={formats} />
    </div>
  );
}
