import UploadClient from "./UploadClient";
import { getDb } from "@/lib/store";

export default async function UploadPage() {
  const db = await getDb();
  const formats = [...db.formats].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">העלאת סרטון לעריכה</h1>
      <p className="mt-1 text-sm text-zinc-400">
        העלה קובץ וידאו, בחר פורמט עריכה, וה-AI יתחיל לערוך אותו לפי ההנחיות שהגדרת.
      </p>

      <UploadClient initialFormats={formats} />
    </div>
  );
}
