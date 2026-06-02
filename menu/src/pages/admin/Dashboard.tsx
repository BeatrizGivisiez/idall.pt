import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Order, OrderStatus } from '../../types';
import { formatCurrency, formatPhoneForWA } from '../../lib/utils';
import toast from 'react-hot-toast';
import { Play, Send, CheckCircle, X, Phone, MapPin, Clock, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusMap: Record<OrderStatus, {
  label: string;
  color: string;
  bg: string;
  dot: string;
  next: OrderStatus | null;
  actionLabel: string;
  actionIcon: React.ElementType | null;
  actionStyle: string;
}> = {
  recebido: {
    label: 'Recebido',
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    dot: 'bg-blue-400',
    next: 'preparando',
    actionLabel: 'PREPARAR',
    actionIcon: Play,
    actionStyle: 'bg-accent text-accent-ink hover:bg-accent-2 border border-accent',
  },
  preparando: {
    label: 'Em Preparo',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    dot: 'bg-yellow-400',
    next: 'saiu',
    actionLabel: 'DESPACHAR',
    actionIcon: Send,
    actionStyle: 'bg-elevated border border-line-2 text-muted hover:bg-surface-2',
  },
  saiu: {
    label: 'Saiu para Entrega',
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
    dot: 'bg-purple-400',
    next: 'finalizado',
    actionLabel: 'CONCLUIR',
    actionIcon: CheckCircle,
    actionStyle: 'bg-elevated border border-line-2 text-muted hover:bg-surface-2',
  },
  finalizado: {
    label: 'Finalizado',
    color: 'text-accent',
    bg: 'bg-accent/12',
    dot: 'bg-accent',
    next: null,
    actionLabel: '',
    actionIcon: null,
    actionStyle: '',
  },
};

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, phone: string) => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose, onUpdateStatus }) => {
  const s = statusMap[order.status];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customerAddress)}`;
  const waUrl = `https://wa.me/55${formatPhoneForWA(order.customerPhone)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface border border-line rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <h3 className="font-bold text-content text-lg">{order.customerName}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-faint font-mono">#{order.id.slice(0, 6).toUpperCase()}</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${s.bg} ${s.color}`}>
                {s.label.toUpperCase()}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-elevated text-faint transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-muted">
            <Clock className="h-4 w-4 shrink-0" />
            <span>Pedido feito às <strong className="text-content">{format(new Date(order.createdAt), "HH:mm", { locale: ptBR })}</strong></span>
          </div>

          {/* Address */}
          <div className="bg-elevated rounded-xl p-4">
            <p className="text-[10px] font-bold text-faint uppercase tracking-wider mb-1">Endereço</p>
            <p className="text-sm text-content font-medium">{order.customerAddress}</p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-accent hover:text-accent-2"
            >
              <MapPin className="h-3.5 w-3.5" /> Ver no mapa
            </a>
          </div>

          {/* Items */}
          <div>
            <p className="text-[10px] font-bold text-faint uppercase tracking-wider mb-2">Itens do pedido</p>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-muted">
                    <span className="font-bold text-content">{item.quantity}x</span> {item.name}
                  </span>
                  <span className="font-bold text-content">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-line pt-2 flex justify-between items-center text-sm font-bold">
                <span className="text-faint">Total</span>
                <span className="text-content text-base">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-line p-4 space-y-2">
          {s.next && s.actionIcon && (
            <button
              onClick={() => { onUpdateStatus(order.id, s.next!, order.customerPhone); onClose(); }}
              className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${s.actionStyle}`}
            >
              {React.createElement(s.actionIcon, { className: 'h-4 w-4' })}
              {s.actionLabel}
            </button>
          )}
          <div className="flex gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-accent/12 hover:bg-accent/20 text-accent transition-colors"
            >
              <Phone className="h-4 w-4" /> Contato
            </a>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-elevated hover:bg-surface-2 text-muted transition-colors"
            >
              <MapPin className="h-4 w-4" /> Endereço
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { tenant } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => setHasPermission(p === 'granted'));
    } else {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    if (!tenant?.id) return;
    const q = query(collection(db, `tenants/${tenant.id}/orders`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)).filter(o => !o.archived);
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !loading) {
          const order = change.doc.data() as Order;
          if (order.status === 'recebido') {
            playNotificationSound();
            if (hasPermission) new Notification('Novo Pedido!', { body: `${order.customerName} - ${formatCurrency(order.total)}` });
          }
        }
      });
      setOrders(newOrders);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tenant?.id, loading, hasPermission]);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) { /* audio blocked by browser */ }
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus, customerPhone: string) => {
    if (!tenant) return;
    try {
      await updateDoc(doc(db, `tenants/${tenant.id}/orders`, orderId), { status: newStatus });
      toast.success('Status atualizado');
      const messages: Partial<Record<OrderStatus, string>> = {
        preparando: 'Seu pedido já está em preparo 🍔🔥',
        saiu: 'Seu pedido saiu para entrega 🚀',
        finalizado: 'Pedido finalizado! Obrigado pela preferência 🙏',
      };
      const msg = messages[newStatus];
      if (msg) window.open(`https://wa.me/55${formatPhoneForWA(customerPhone)}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch {
      toast.error('Erro ao atualizar pedido');
    }
  };

  const archiveOrder = async (order: Order) => {
    if (!tenant) return;
    try {
      await addDoc(collection(db, `tenants/${tenant.id}/sales`), {
        orderId: order.id,
        customerName: order.customerName || '',
        customerPhone: order.customerPhone || '',
        customerAddress: order.customerAddress || '',
        items: order.items || [],
        total: order.total || 0,
        createdAt: order.createdAt || Date.now(),
        completedAt: Date.now(),
      });
      await updateDoc(doc(db, `tenants/${tenant.id}/orders`, order.id), { archived: true });
      toast.success('Pedido arquivado nas vendas');
    } catch (err) {
      console.error('Archive error:', err);
      toast.error('Erro ao arquivar pedido');
    }
  };

  if (loading) return (
    <div className="animate-pulse flex space-x-4">
      <div className="h-4 bg-elevated rounded w-1/4"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-6">
      <h2 className="text-xl font-bold tracking-tight text-content">Gerenciador de Pedidos</h2>

      {!tenant?.whatsapp && (
        <div className="bg-warn/8 border-l-4 border-warn p-4 rounded-r-lg">
          <p className="text-sm font-medium text-warn">
            Configure seu WhatsApp nas configurações para ativar notificações aos clientes.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 flex-1 overflow-hidden pb-4">
        {(Object.keys(statusMap) as OrderStatus[]).map((statusKey) => {
          const filteredOrders = orders.filter(o => o.status === statusKey);
          const s = statusMap[statusKey];

          return (
            <div key={statusKey} className="flex flex-col rounded-2xl bg-surface border border-line p-4 overflow-hidden">
              <h3 className="text-[10px] font-bold text-faint uppercase tracking-wider mb-4 flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${s.dot}`}></span>
                {statusKey === 'recebido' ? 'Pedidos em Andamento' : s.label}
                <span className="ml-auto bg-elevated text-faint py-0.5 px-2 rounded-full text-[10px] font-bold">
                  {filteredOrders.length}
                </span>
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                {filteredOrders.map(order => (
                  <div
                    key={order.id}
                    className="bg-surface border border-line rounded-xl p-4 hover:border-accent/30 transition-all flex flex-col cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[10px] font-bold text-faint uppercase tracking-widest">#{order.id.slice(0, 4)}</span>
                        <h4 className="font-bold text-content text-sm">{order.customerName}</h4>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${s.bg} ${s.color}`}>
                        {s.label.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5 mb-2">
                      <MapPin className="w-3 h-3 text-faint mt-0.5 shrink-0" />
                      <p className="text-xs text-muted line-clamp-2">{order.customerAddress}</p>
                    </div>

                    <div className="text-xs text-muted line-clamp-1 mb-1">
                      {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                    <div className="font-bold text-sm text-content">{formatCurrency(order.total)}</div>

                    <div
                      className="mt-3 pt-3 border-t border-line space-y-2"
                      onClick={e => e.stopPropagation()}
                    >
                      {s.next && s.actionIcon && (
                        <button
                          className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${s.actionStyle}`}
                          onClick={() => updateStatus(order.id, s.next!, order.customerPhone)}
                        >
                          {React.createElement(s.actionIcon, { className: 'w-3.5 h-3.5' })}
                          {s.actionLabel}
                        </button>
                      )}
                      {order.status === 'finalizado' && (
                        <button
                          className="w-full py-1.5 bg-accent text-accent-ink hover:bg-accent-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          onClick={() => archiveOrder(order)}
                        >
                          <Archive className="w-3.5 h-3.5" /> Terminar
                        </button>
                      )}
                      <button
                        className="w-full py-1.5 bg-accent/8 hover:bg-accent/15 text-accent rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        onClick={() => window.open(`https://wa.me/55${formatPhoneForWA(order.customerPhone)}`, '_blank')}
                      >
                        <Phone className="w-3.5 h-3.5" /> Contato WhatsApp
                      </button>
                    </div>
                  </div>
                ))}

                {filteredOrders.length === 0 && (
                  <div className="text-center text-xs font-medium text-faint py-6 border-2 border-dashed border-line rounded-xl">
                    {statusKey === 'recebido' ? 'Nenhum pedido em andamento.' : 'Nenhum pedido ainda.'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateStatus}
        />
      )}
    </div>
  );
};
