import { useState } from 'react';
import CsvUploader from '@/components/upload/CsvUploader';
import ManualEntryForm from '@/components/upload/ManualEntryForm';
import UploadResultCard from '@/components/upload/UploadResultCard';
import { uploadCsv, uploadRows, type UploadResult, type TransactionRow } from '@/api/upload';

export default function UploadPage() {
  const [tab, setTab] = useState<'csv' | 'manual'>('csv');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCsvUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await uploadCsv(file);
      setResult(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail?.message || e.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRowsSubmit = async (rows: TransactionRow[]) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await uploadRows(rows);
      setResult(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail?.message || e.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1000px] mx-auto">
      <h1 className="text-xl font-semibold">Data Upload</h1>

      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'csv'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setTab('csv')}
        >
          CSV Upload
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'manual'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setTab('manual')}
        >
          Manual Entry
        </button>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {result && <UploadResultCard result={result} />}

      {tab === 'csv' ? (
        <CsvUploader onUpload={handleCsvUpload} loading={loading} />
      ) : (
        <ManualEntryForm onSubmit={handleRowsSubmit} loading={loading} />
      )}
    </div>
  );
}
