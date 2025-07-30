import { Feather as FeatherIcon } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { addDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Button, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Icons, Shadows, Spacing, Typography } from '../constants/DesignSystem';
import { db } from '../services/firebase';

interface Payment {
  id: string;
  method: string;
  value: number;
}

interface FormaPgto {
  id: string;
  label: string;
  icon: string;
  ativa?: boolean;
  taxa: number; // Taxa sempre presente como número
}

interface ProdutoVenda {
  id: string;
  nome: string;
  precoVenda: number;
  precoCompra: number;
  valorEditado?: number;
}

interface CheckoutModalProps {
  isVisible: boolean;
  onClose: () => void;
  clientName: string;
  totalValue: number;
  formasPgto: FormaPgto[];
  onFinishCheckout: (data: { finalPrice: number; paymentMethod: FormaPgto; produtosVendidos: ProdutoVenda[] }) => void;
  idSalao: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isVisible,
  onClose,
  clientName,
  totalValue,
  formasPgto,
  onFinishCheckout,
  idSalao,
}) => {
  const [currentPaymentValue, setCurrentPaymentValue] = useState('');
  useEffect(() => {
    if (isVisible) {
      setCurrentPaymentValue(totalValue > 0 ? String(totalValue) : '');
    }
  }, [isVisible, totalValue]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<FormaPgto | null>(formasPgto?.[0] || null);
  const [produtos, setProdutos] = useState<ProdutoVenda[]>([]);
  const [produtosSelecionados, setProdutosSelecionados] = useState<ProdutoVenda[]>([]);
  const [modalProdutos, setModalProdutos] = useState(false);
  const [buscaProduto, setBuscaProduto] = useState('');

  // Buscar produtos do Firestore ao abrir modal (por salão)
  useEffect(() => {
    if (!modalProdutos || !idSalao) return;
    async function fetchProdutos() {
      const q = query(collection(db, 'saloes', idSalao, 'produtos'), orderBy('nome'));
      const snap = await getDocs(q);
      setProdutos(snap.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().nome,
        precoVenda: Number(doc.data().precoVenda) || 0,
        precoCompra: Number(doc.data().precoCompra) || 0,
      })));
    }
    fetchProdutos();
  }, [modalProdutos, idSalao]);

  // Soma total do serviço + produtos
  const totalProdutos = produtosSelecionados.reduce((acc, p) => acc + (p.valorEditado ?? p.precoVenda), 0);
  const totalCheckout = (Number(currentPaymentValue.replace(',', '.')) || 0) + totalProdutos;

  const handleAddProduto = (produto: ProdutoVenda) => {
    setProdutosSelecionados(prev => [...prev, { ...produto }]);
    setModalProdutos(false);
  };
  const handleEditValorProduto = (idx: number, valor: string) => {
    setProdutosSelecionados(prev => prev.map((p, i) => i === idx ? { ...p, valorEditado: Number(valor) } : p));
  };
  const handleRemoveProduto = (idx: number) => {
    setProdutosSelecionados(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFinishCheckout = async () => {
    const valorTotalDaVenda = totalCheckout;
    const formaDePagamentoSelecionada = selectedPaymentMethod;
    if (!valorTotalDaVenda || !formaDePagamentoSelecionada) return;

    let valorDaTaxa = 0;
    const taxaRaw = Number(formaDePagamentoSelecionada.taxa);
    console.log('=== DEBUG CHECKOUT ===');
    console.log('Checkout - Forma de pagamento:', formaDePagamentoSelecionada.label);
    console.log('Checkout - Taxa configurada:', taxaRaw);
    console.log('Checkout - Taxa original (string):', formaDePagamentoSelecionada.taxa);
    console.log('Checkout - Valor total da venda:', valorTotalDaVenda);
    console.log('Checkout - Objeto forma de pagamento completo:', formaDePagamentoSelecionada);
    
    if (!isNaN(taxaRaw) && taxaRaw > 0) {
      const taxaPercentual = taxaRaw / 100;
      valorDaTaxa = valorTotalDaVenda * taxaPercentual;
      console.log('Checkout - Taxa calculada:', valorDaTaxa);
      console.log('Checkout - Taxa percentual:', taxaPercentual);
    } else {
      console.log('Checkout - Taxa não aplicada (taxaRaw <= 0 ou NaN)');
    }
    
    // Lançar receita BRUTA
    onFinishCheckout({ finalPrice: valorTotalDaVenda, paymentMethod: formaDePagamentoSelecionada, produtosVendidos: produtosSelecionados });
    
    // Lançar despesa de taxa, se houver
    if (valorDaTaxa > 0.0001 && idSalao) {
      console.log('Checkout - Criando despesa de taxa:', valorDaTaxa);
      const despesasRef = collection(db, 'saloes', idSalao, 'despesas');
      await addDoc(despesasRef, {
        nome: `Taxa - ${formaDePagamentoSelecionada.label}`,
        valor: valorDaTaxa,
        categoria: 'Taxas de Operadora',
        data: new Date(),
      });
      console.log('Checkout - Despesa de taxa criada com sucesso');
    } else {
      console.log('Checkout - Despesa de taxa não criada (valorDaTaxa <= 0.0001 ou idSalao não encontrado)');
    }
    console.log('=== FIM DEBUG CHECKOUT ===');
    onClose();
    setCurrentPaymentValue('');
    setProdutosSelecionados([]);
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        {totalValue === 0 && (
          <View style={{ backgroundColor: '#FFF3CD', padding: 16, borderRadius: 8, margin: 16 }}>
            <Text style={{ color: '#856404', fontWeight: 'bold', textAlign: 'center' }}>
              Atenção: O valor do serviço está zerado!
            </Text>
          </View>
        )}
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FeatherIcon name="x" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Cliente */}
          <Text style={styles.clientName}>{clientName}</Text>

          {/* Valor Total Editável */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Valor Serviço</Text>
              <TextInput
                style={[styles.valueInput, { width: 120, textAlign: 'right' }]}
                value={currentPaymentValue}
                onChangeText={setCurrentPaymentValue}
                placeholder="0,00"
                keyboardType="numeric"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
          </View>
          {/* Produtos Selecionados */}
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.summaryLabel}>Produtos</Text>
              <TouchableOpacity onPress={() => setModalProdutos(true)} style={{ backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ Produto</Text>
              </TouchableOpacity>
            </View>
            {produtosSelecionados.length === 0 && (
              <Text style={{ color: Colors.textSecondary, marginTop: 8 }}>Nenhum produto adicionado.</Text>
            )}
            {produtosSelecionados.map((p, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ flex: 2 }}>{p.nome}</Text>
                <TextInput
                  style={[styles.valueInput, { width: 80, textAlign: 'right', marginRight: 8 }]}
                  value={String(p.valorEditado ?? p.precoVenda)}
                  onChangeText={valor => handleEditValorProduto(idx, valor)}
                  keyboardType="numeric"
                />
                <TouchableOpacity onPress={() => handleRemoveProduto(idx)}>
                  <FeatherIcon name="trash-2" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            {produtosSelecionados.length > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                <Text style={{ fontWeight: 'bold', color: Colors.textPrimary }}>Total Produtos: {formatCurrency(totalProdutos)}</Text>
              </View>
            )}
          </View>
          {/* Modal de Seleção de Produtos (Picker igual Venda Rápida) */}
          <Modal visible={modalProdutos} animationType="slide" onRequestClose={() => setModalProdutos(false)}>
            <View style={{ flex: 1, backgroundColor: '#fff', padding: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Selecionar Produto</Text>
              <View style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, marginBottom: 16 }}>
                <Picker
                  selectedValue={''}
                  onValueChange={id => {
                    const p = produtos.find(prod => prod.id === id);
                    if (p) handleAddProduto(p);
                  }}
                  style={{ height: 48, fontSize: 13 }}
                  itemStyle={{ fontSize: 13 }}
                >
                  <Picker.Item label="Selecione um produto..." value="" style={{ fontSize: 13 }} />
                  {produtos.map(p => (
                    <Picker.Item key={p.id} label={`${p.nome} (Venda: R$${Number(p.precoVenda).toFixed(2)} | Custo: R$${Number(p.precoCompra).toFixed(2)})`} value={p.id} style={{ fontSize: 13 }} />
                  ))}
                </Picker>
              </View>
              <Button title="Fechar" onPress={() => setModalProdutos(false)} color={Colors.primary} />
            </View>
          </Modal>

          {/* Forma de Pagamento */}
          <View style={styles.addPaymentSection}>
            <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
            <View style={styles.paymentMethodsContainer}>
              {formasPgto.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethodButton,
                    selectedPaymentMethod?.id === method.id && styles.selectedPaymentMethod
                  ]}
                  onPress={() => setSelectedPaymentMethod(method)}
                >
                  <FeatherIcon 
                    name={method.icon as any} 
                    size={16} 
                    color={selectedPaymentMethod?.id === method.id ? Colors.background : Colors.textSecondary} 
                  />
                  <Text style={[
                    styles.paymentMethodText,
                    selectedPaymentMethod?.id === method.id && styles.selectedPaymentMethodText
                  ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Botão de Ação Principal */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.primaryButton, { opacity: totalCheckout && selectedPaymentMethod ? 1 : 0.5 }]} 
            onPress={handleFinishCheckout}
            disabled={!totalCheckout || !selectedPaymentMethod}
          >
            <FeatherIcon name="check" size={Icons.size} color={Colors.background} />
            <Text style={styles.primaryButtonText}>Finalizar Checkout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Spacing.base,
  },
  headerTitle: {
    ...Typography.H2,
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.screenPadding,
  },
  clientName: {
    ...Typography.H1,
    color: Colors.textPrimary,
    marginBottom: Spacing.base * 3,
  },
  summarySection: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Spacing.cardRadius,
    padding: Spacing.base * 2,
    marginBottom: Spacing.base * 3,
    ...Shadows.card,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  summaryLabel: {
    ...Typography.Caption,
    color: Colors.textSecondary,
  },
  summaryValue: {
    ...Typography.BodySemibold,
    color: Colors.textPrimary,
  },
  paymentsSection: {
    marginBottom: Spacing.base * 3,
  },
  sectionTitle: {
    ...Typography.H2,
    color: Colors.textPrimary,
    marginBottom: Spacing.base * 2,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethod: {
    ...Typography.Body,
    color: Colors.textSecondary,
    marginLeft: Spacing.base,
  },
  paymentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentValue: {
    ...Typography.BodySemibold,
    color: Colors.textPrimary,
    marginRight: Spacing.base,
  },
  addPaymentSection: {
    marginBottom: Spacing.base * 3,
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.base * 2,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base * 2,
    paddingVertical: Spacing.base,
    borderRadius: Spacing.buttonRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.base,
    marginBottom: Spacing.base,
  },
  selectedPaymentMethod: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  paymentMethodText: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.base / 2,
  },
  selectedPaymentMethodText: {
    color: Colors.background,
  },
  valueInputContainer: {
    marginBottom: Spacing.base * 2,
  },
  inputLabel: {
    ...Typography.Body,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
  },
  valueInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.buttonRadius,
    padding: Spacing.base * 2,
    ...Typography.Body,
    color: Colors.textPrimary,
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: Spacing.base * 2,
    borderRadius: Spacing.buttonRadius,
  },
  addPaymentButtonText: {
    ...Typography.Button,
    color: Colors.background,
    marginLeft: Spacing.base,
  },
  footer: {
    padding: Spacing.screenPadding,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    padding: Spacing.base * 2,
    borderRadius: Spacing.buttonRadius,
  },
  primaryButtonText: {
    ...Typography.Button,
    color: Colors.background,
    marginLeft: Spacing.base,
  },
}); 