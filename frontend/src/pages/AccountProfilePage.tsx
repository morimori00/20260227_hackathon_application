import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Loading from '@/components/layout/Loading';
import AccountHeader from '@/components/accounts/AccountHeader';
import SummaryCards from '@/components/accounts/SummaryCards';
import TimelineChart from '@/components/accounts/TimelineChart';
import { getAccount, getAccountTransactions, getCounterparties, getTimeline } from '@/api/accounts';

export default function AccountProfilePage() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [counterparties, setCounterparties] = useState<any[]>([]);
  const [cpTotal, setCpTotal] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [txPage, setTxPage] = useState(1);
  const [cpDirection, setCpDirection] = useState('all');

  useEffect(() => {
    if (!accountId) return;
    setLoading(true);
    Promise.all([
      getAccount(accountId),
      getTimeline(accountId),
      getCounterparties(accountId, { direction: 'all' }),
      getAccountTransactions(accountId, { per_page: 20 }),
    ]).then(([accRes, tlRes, cpRes, txRes]) => {
      setProfile(accRes.data);
      setTimeline(tlRes.data);
      setCounterparties(cpRes.data);
      setCpTotal(cpRes.meta.total);
      setTransactions(txRes.data);
      setTxTotal(txRes.meta.total);
    }).catch(console.error).finally(() => setLoading(false));
  }, [accountId]);

  useEffect(() => {
    if (!accountId) return;
    getCounterparties(accountId, { direction: cpDirection }).then((r) => {
      setCounterparties(r.data);
      setCpTotal(r.meta.total);
    });
  }, [accountId, cpDirection]);

  useEffect(() => {
    if (!accountId) return;
    getAccountTransactions(accountId, { page: txPage, per_page: 20 }).then((r) => {
      setTransactions(r.data);
      setTxTotal(r.meta.total);
    });
  }, [accountId, txPage]);

  if (loading) return <Loading />;
  if (!profile) return <div className="p-6 text-center text-muted-foreground">Account not found</div>;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-xs">
        Back
      </Button>

      <AccountHeader data={profile} />
      <SummaryCards summary={profile.summary} />

      {timeline.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Transaction Timeline</h3>
            <TimelineChart data={timeline} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Counterparties ({cpTotal})</h3>
          <Tabs value={cpDirection} onValueChange={setCpDirection}>
            <TabsList>
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="sent" className="text-xs">Sent</TabsTrigger>
              <TabsTrigger value="received" className="text-xs">Received</TabsTrigger>
            </TabsList>
            <TabsContent value={cpDirection}>
              <div className="border rounded-md max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs bg-muted/50">
                      <TableHead>Account</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead className="text-right">Txn Count</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead>Last Txn</TableHead>
                      <TableHead>Flagged</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {counterparties.map((cp: any) => (
                      <TableRow
                        key={cp.account_id}
                        className="text-xs cursor-pointer hover:bg-accent/50"
                        onClick={() => navigate(`/accounts/${cp.account_id}`)}
                      >
                        <TableCell className="font-mono">{cp.account_id}</TableCell>
                        <TableCell>{cp.bank_name}</TableCell>
                        <TableCell className="text-right">{cp.transaction_count}</TableCell>
                        <TableCell className="text-right font-mono">{cp.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>{new Date(cp.last_transaction_date).toLocaleDateString()}</TableCell>
                        <TableCell>{cp.has_flagged_transactions ? <span className="text-destructive">Yes</span> : 'No'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Related Transactions ({txTotal})</h3>
          <div className="border rounded-md max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs bg-muted/50">
                  <TableHead>Time</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx: any) => (
                  <TableRow
                    key={tx.id}
                    className={`text-xs cursor-pointer hover:bg-accent/50 ${tx.prediction === 1 ? 'bg-red-50' : ''}`}
                    onClick={() => navigate(`/transactions/${tx.id}`)}
                  >
                    <TableCell className="whitespace-nowrap">{new Date(tx.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="font-mono">{tx.from_account}</TableCell>
                    <TableCell className="font-mono">{tx.to_account}</TableCell>
                    <TableCell className="text-right font-mono">{tx.amount_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{tx.payment_currency}</TableCell>
                    <TableCell>{(tx.fraud_score * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {txTotal > 20 && (
            <div className="flex items-center justify-end gap-2 mt-2">
              <Button variant="outline" size="sm" disabled={txPage === 1} onClick={() => setTxPage(txPage - 1)}>Prev</Button>
              <span className="text-xs">{txPage} / {Math.ceil(txTotal / 20)}</span>
              <Button variant="outline" size="sm" disabled={txPage >= Math.ceil(txTotal / 20)} onClick={() => setTxPage(txPage + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
