import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Loading from '@/components/layout/Loading';
import TransactionCard from '@/components/transactions/TransactionCard';
import FraudScoreDisplay from '@/components/transactions/FraudScoreDisplay';
import FeatureImportanceChart from '@/components/transactions/FeatureImportanceChart';
import { getTransactionDetail } from '@/api/transactions';
import { getAccountTransactions } from '@/api/accounts';
import { getNotes, createNote } from '@/api/notes';
import { ArrowLeft } from 'lucide-react';

export default function TransactionDetailPage() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const [txn, setTxn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [senderHistory, setSenderHistory] = useState<any[]>([]);
  const [receiverHistory, setReceiverHistory] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [noteContent, setNoteContent] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('operator');

  useEffect(() => {
    if (!transactionId) return;
    setLoading(true);
    Promise.all([
      getTransactionDetail(transactionId),
      getNotes(transactionId),
    ]).then(([txnRes, notesRes]) => {
      setTxn(txnRes.data);
      setNotes(notesRes.data);

      return Promise.all([
        getAccountTransactions(txnRes.data.from_account, { direction: 'sent', per_page: 20 }),
        getAccountTransactions(txnRes.data.to_account, { direction: 'received', per_page: 20 }),
      ]);
    }).then(([senderRes, receiverRes]) => {
      setSenderHistory(senderRes.data);
      setReceiverHistory(receiverRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [transactionId]);

  const handleAddNote = async () => {
    if (!transactionId || !noteContent.trim()) return;
    await createNote(transactionId, noteContent, noteAuthor);
    const res = await getNotes(transactionId);
    setNotes(res.data);
    setNoteContent('');
  };

  if (loading) return <Loading />;
  if (!txn) return <div className="p-6 text-center text-muted-foreground">Transaction not found</div>;

  const HistoryTable = ({ data }: { data: any[] }) => (
    <div className="border rounded-md max-h-[400px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="text-xs bg-muted/50">
            <TableHead>Time</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r: any) => (
            <TableRow
              key={r.id}
              className={`text-xs cursor-pointer hover:bg-accent/50 ${r.prediction === 1 ? 'bg-red-50' : ''}`}
              onClick={() => navigate(`/transactions/${r.id}`)}
            >
              <TableCell className="whitespace-nowrap">{new Date(r.timestamp).toLocaleString()}</TableCell>
              <TableCell className="font-mono">{r.from_account}</TableCell>
              <TableCell className="font-mono">{r.to_account}</TableCell>
              <TableCell className="text-right font-mono">{r.amount_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
              <TableCell>{(r.fraud_score * 100).toFixed(1)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-xs">
        <ArrowLeft />Back
      </Button>
      
      <div>
          <TransactionCard data={txn} />
      </div>

      <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center">
              <FraudScoreDisplay score={txn.fraud_score} />
            </CardContent>
          </Card>
          {txn.feature_importances?.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3">Feature Importance</h3>
                <FeatureImportanceChart features={txn.feature_importances} />
              </CardContent>
            </Card>
          )}
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Transaction History</h3>
          <Tabs defaultValue="sender">
            <TabsList>
              <TabsTrigger value="sender" className="text-xs">Sender History</TabsTrigger>
              <TabsTrigger value="receiver" className="text-xs">Receiver History</TabsTrigger>
            </TabsList>
            <TabsContent value="sender">
              <HistoryTable data={senderHistory} />
            </TabsContent>
            <TabsContent value="receiver">
              <HistoryTable data={receiverHistory} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Notes</h3>
          <div className="flex gap-2 mb-4">
            <textarea
              className="flex-1 border rounded-md p-2 text-sm resize-none"
              rows={2}
              maxLength={500}
              placeholder="Add a note..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
            <div className="flex flex-col gap-1">
              <input
                className="border rounded-md px-2 py-1 text-xs w-24"
                placeholder="Author"
                value={noteAuthor}
                onChange={(e) => setNoteAuthor(e.target.value)}
              />
              <Button size="sm" onClick={handleAddNote} disabled={!noteContent.trim()}>
                Save
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {notes.map((n: any) => (
              <div key={n.note_id} className="border-l-2 border-border pl-3 py-1">
                <div className="text-xs text-muted-foreground">
                  {n.author} - {new Date(n.created_at).toLocaleString()}
                </div>
                <div className="text-sm mt-1">{n.content}</div>
              </div>
            ))}
            {notes.length === 0 && (
              <div className="text-xs text-muted-foreground">No notes yet</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
