import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet as WalletIcon, Plus, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Wallet() {
  const queryClient = useQueryClient();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: async () => {
      const wallets = await base44.entities.Wallet.filter({ user_id: user?.id });
      if (wallets.length === 0) {
        const country = user?.country || 'Malawi';
        const exchangeRate = await base44.entities.ExchangeRate.filter({ country, is_active: true }).then(r => r[0]);
        const currency = exchangeRate?.currency_code || 'USD';
        const newWallet = await base44.entities.Wallet.create({
          user_id: user.id,
          balance: 0,
          currency: currency,
        });
        return newWallet;
      }
      return wallets[0];
    },
    enabled: !!user?.id,
  });

  const { data: transactions } = useQuery({
    queryKey: ['wallet-transactions', user?.id],
    queryFn: () => base44.entities.WalletTransaction.filter({ user_id: user?.id }, '-created_date', 50),
    enabled: !!user?.id,
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const country = user?.country || 'Malawi';
      return await base44.entities.PaymentMethod.filter({ country, is_active: true }, 'sort_order');
    },
    enabled: !!user?.id && topUpOpen,
  });

  const createTopUpMutation = useMutation({
    mutationFn: async (data) => {
      const transaction = await base44.entities.WalletTransaction.create({
        user_id: user.id,
        type: 'top_up',
        amount: parseFloat(data.amount),
        amount_usd: data.amountUsd,
        currency: wallet?.currency || 'USD',
        payment_method: data.paymentMethod,
        payment_reference: data.reference,
        payment_proof_url: data.proofFile,
        status: 'pending',
        description: `Wallet top-up via ${data.paymentMethod}`,
      });
      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      setTopUpOpen(false);
      setTopUpAmount('');
      toast.success('Top-up request submitted! We\'ll verify your payment shortly.');
    },
  });

  const handleSubmitTopUp = async (e) => {
    e.preventDefault();
    if (!selectedMethod || !topUpAmount) {
      toast.error('Please select a payment method and enter amount.');
      return;
    }

    const rate = await base44.entities.ExchangeRate.filter({ currency_code: wallet?.currency }).then(r => r[0]);
    const amountUsd = rate ? parseFloat(topUpAmount) / rate.rate_to_usd : parseFloat(topUpAmount);

    createTopUpMutation.mutate({
      amount: topUpAmount,
      amountUsd,
      paymentMethod: selectedMethod,
      reference: '',
      proofFile: '',
    });
  };

  const formatCurrency = (amount, currency) => {
    if (currency === 'USD') return `$${amount.toFixed(2)}`;
    return `${currency} ${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700',
      confirmed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    const icons = {
      pending: <Clock className="w-3 h-3 mr-1" />,
      confirmed: <CheckCircle2 className="w-3 h-3 mr-1" />,
      rejected: <XCircle className="w-3 h-3 mr-1" />,
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (walletLoading) return <div className="p-8 text-center text-muted-foreground">Loading wallet...</div>;

  const topUps = transactions?.filter(t => t.type === 'top_up') || [];
  const payments = transactions?.filter(t => t.type === 'payment') || [];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Wallet Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your balance and transactions</p>
        </div>
        <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Top Up
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Top Up Your Wallet</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitTopUp} className="space-y-4">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder={`Enter amount in ${wallet?.currency || 'USD'}`}
                  required
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods?.map((method) => (
                      <SelectItem key={method.id} value={method.method_name}>
                        {method.method_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createTopUpMutation.isPending}>
                {createTopUpMutation.isPending ? 'Submitting...' : 'Submit Top-Up Request'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 border-0 text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <WalletIcon className="w-5 h-5" /> Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold font-heading">
            {formatCurrency(wallet?.balance || 0, wallet?.currency || 'USD')}
          </p>
          <p className="text-sm opacity-80 mt-2">{wallet?.currency || 'USD'}</p>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-green-600" /> Total Top-Ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{topUps.length}</p>
            <p className="text-xs text-muted-foreground">
              {topUps.filter(t => t.status === 'confirmed').length} confirmed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-blue-600" /> Total Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{payments.length}</p>
            <p className="text-xs text-muted-foreground">Campaign payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" /> Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {transactions?.filter(t => t.status === 'pending').length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Top-Ups and Payments */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Top-Ups */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowUpCircle className="w-5 h-5 text-green-600" /> Recent Top-Ups
                </CardTitle>
                <CardDescription>Your latest wallet top-ups</CardDescription>
              </div>
              {topUps.length > 0 && (
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                  {topUps.length} total
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {topUps.length > 0 ? (
              <div className="space-y-3">
                {topUps.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
                        <ArrowUpCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{formatCurrency(tx.amount, tx.currency)}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.payment_method || 'Top-up'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(tx.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ArrowUpCircle className="w-12 h-12 mx-auto mb-3 opacity-20 text-green-600" />
                <p className="text-sm">No top-ups yet</p>
                <Button variant="link" size="sm" onClick={() => setTopUpOpen(true)} className="mt-2">
                  Top up now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowDownCircle className="w-5 h-5 text-blue-600" /> Recent Payments
                </CardTitle>
                <CardDescription>Campaign payments from wallet</CardDescription>
              </div>
              {payments.length > 0 && (
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                  {payments.length} total
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                        <ArrowDownCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{formatCurrency(tx.amount, tx.currency)}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.description || 'Campaign payment'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Paid</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ArrowDownCircle className="w-12 h-12 mx-auto mb-3 opacity-20 text-blue-600" />
                <p className="text-sm">No payments yet</p>
                <Link to="/campaigns">
                  <Button variant="link" size="sm" className="mt-2">
                    Create campaign
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Complete Transaction History</CardTitle>
          <CardDescription>All your wallet transactions in one place</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl hover:bg-secondary/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'top_up' ? 'bg-green-100 text-green-700' :
                      tx.type === 'payment' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {tx.type === 'top_up' ? <ArrowUpCircle className="w-5 h-5" /> :
                       tx.type === 'payment' ? <ArrowDownCircle className="w-5 h-5" /> :
                       <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm capitalize">{tx.type.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">{tx.description || tx.payment_method}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${
                      tx.type === 'top_up' ? 'text-green-600' :
                      tx.type === 'payment' ? 'text-blue-600' :
                      'text-foreground'
                    }`}>
                      {tx.type === 'top_up' ? '+' : tx.type === 'payment' ? '-' : ''}
                      {formatCurrency(tx.amount, tx.currency)}
                    </p>
                    {getStatusBadge(tx.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <WalletIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">Top up your wallet to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}