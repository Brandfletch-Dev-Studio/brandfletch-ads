import { useState, useEffect } from 'react';
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
import { Link, useNavigate } from 'react-router-dom';

export default function Wallet() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: async () => {
      const wallets = await base44.entities.Wallet.filter({ user_id: user?.id });
      if (wallets.length === 0) {
        // Create wallet if doesn't exist
        const newWallet = await base44.entities.Wallet.create({
          user_id: user.id,
          balance: 0,
          currency: 'USD',
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
      const proofFile = data.proofFile;
      const transaction = await base44.entities.WalletTransaction.create({
        user_id: user.id,
        type: 'top_up',
        amount: parseFloat(data.amount),
        amount_usd: data.amountUsd,
        currency: wallet?.currency || 'USD',
        payment_method: data.paymentMethod,
        payment_reference: data.reference,
        payment_proof_url: proofFile,
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

    // Get exchange rate to calculate USD
    const rate = await base44.entities.ExchangeRate.filter({ currency_code: wallet?.currency }).then(r => r[0]);
    const amountUsd = rate ? parseFloat(topUpAmount) / rate.rate_to_usd : parseFloat(topUpAmount);

    // For demo, we'll just submit without proof upload
    // In production, you'd need to upload proof like in CampaignPayment
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

  if (walletLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading wallet...</div>;
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">My Wallet</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your balance and view transactions</p>
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
              <div className="p-3 bg-secondary/50 rounded-lg text-sm">
                <p className="text-muted-foreground">You'll be redirected to submit payment proof after clicking Submit.</p>
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

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-green-600" /> Use Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Pay for campaigns instantly using your wallet balance. No payment review needed!
            </p>
            <Link to="/campaigns">
              <Button variant="outline" size="sm" className="w-full">
                Create Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-blue-600" /> Auto Top-Up
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Set up automatic top-ups when your balance runs low.
            </p>
            <Button variant="outline" size="sm" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
          <CardDescription>View all your wallet transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        tx.type === 'top_up'
                          ? 'bg-green-100 text-green-700'
                          : tx.type === 'payment'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {tx.type === 'top_up' ? (
                        <ArrowUpCircle className="w-5 h-5" />
                      ) : tx.type === 'payment' ? (
                        <ArrowDownCircle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm capitalize">
                        {tx.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.description || tx.payment_method}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-sm ${
                        tx.type === 'top_up'
                          ? 'text-green-600'
                          : tx.type === 'payment'
                          ? 'text-blue-600'
                          : 'text-foreground'
                      }`}
                    >
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
              <p className="text-xs text-muted-foreground mt-1">
                Top up your wallet to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}