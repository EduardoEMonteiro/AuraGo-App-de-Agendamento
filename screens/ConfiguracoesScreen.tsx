import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Formik } from 'formik';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Yup from 'yup';
import { useAuthStore } from '../contexts/useAuthStore';
import { db } from '../services/firebase';

const configOptions = [
    { key: 'payments', icon: 'credit-card', title: 'Formas de Pagamento', description: 'Gerencie as formas de pagamento' },
    { key: 'logout', icon: 'log-out', title: 'Sair', description: 'Encerrar sessão' },
];

export default function ConfiguracoesScreen() {
    const [modal, setModal] = useState<string | null>(null);
    const { user, setUser, logout } = useAuthStore();
    console.log('CONFIGURACOES user:', user);
    const router = useRouter();

    function handleOptionPress(key: string) {
        if (key === 'logout') {
            logout();
            return;
        }
        if (key === 'payments') {
            router.push('/pagamentos');
            return;
        }
        setModal(key);
    }

    return (
        <>
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Configurações</Text>
                <View style={styles.optionsContainer}>
                    {/* Perfil (unificado) */}
                    <TouchableOpacity
                        key="account"
                        style={styles.card}
                        onPress={() => router.push({ pathname: '/ContaScreen', params: { user: JSON.stringify(user) } })}
                        accessibilityLabel="Perfil"
                        accessibilityHint="Gerencie seu nome, telefone, e-mail e redefina sua senha."
                    >
                        <View style={styles.iconWrapper}>
                            <Feather name="user" size={24} color="#1976d2" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>Perfil</Text>
                            <Text style={styles.cardDesc}>Gerencie seu nome, telefone, e-mail e redefina sua senha.</Text>
                        </View>
                        <Feather name="chevron-right" size={22} color="#888" />
                    </TouchableOpacity>

                    {/* Horário de Funcionamento */}
                    <TouchableOpacity
                        key="horario"
                        style={styles.card}
                        onPress={() => router.push({ pathname: '/HorarioFuncionamentoScreen', params: { user } })}
                        accessibilityLabel="Horário de Funcionamento"
                        accessibilityHint="Editar horário de funcionamento do salão"
                    >
                        <View style={styles.iconWrapper}>
                            <Feather name="clock" size={22} color="#1976d2" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>Horário de Funcionamento</Text>
                            <Text style={styles.cardDesc}>Editar horário de funcionamento do salão</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#888" />
                    </TouchableOpacity>

                    {/* Mensagens de Confirmação */}
                    <TouchableOpacity
                        key="whats"
                        style={styles.card}
                        onPress={() => router.push({ pathname: '/mensagens', params: { user: JSON.stringify(user) } })}
                        accessibilityLabel="Mensagens de Confirmação"
                        accessibilityHint="Editar mensagem padrão de confirmação do WhatsApp"
                    >
                        <View style={styles.iconWrapper}>
                            <Feather name="message-circle" size={22} color="#1976d2" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>Mensagens de Confirmação</Text>
                            <Text style={styles.cardDesc}>Editar mensagem padrão de confirmação do WhatsApp</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#888" />
                    </TouchableOpacity>

                    {/* Demais opções */}
                    {configOptions.map(opt => (
                        <TouchableOpacity
                            key={opt.key}
                            style={styles.card}
                            onPress={() => handleOptionPress(opt.key)}
                            accessibilityLabel={opt.title}
                            accessibilityHint={opt.description}
                        >
                            <View style={styles.iconWrapper}>
                                <Feather name={opt.icon as any} size={24} color="#1976d2" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>{opt.title}</Text>
                                <Text style={styles.cardDesc}>{opt.description}</Text>
                            </View>
                            <Feather name="chevron-right" size={22} color="#888" />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
            {/* Modais fora do ScrollView para overlay correto */}
            {modal === 'notifications' && <MockModal title="Notificações" onClose={() => setModal(null)} />}
            {modal === 'plan' && <MockModal title="Plano" onClose={() => setModal(null)} />}
            {modal === 'export' && <MockModal title="Exportação" onClose={() => setModal(null)} />}
        </>
    );
}

function EditProfileModal({ user, onClose, setUser }: { user: any, onClose: () => void, setUser: (u: any) => void }) {
    const perfilSchema = Yup.object().shape({
        nome: Yup.string().required('Nome obrigatório'),
        email: Yup.string().email('E-mail inválido').required('E-mail obrigatório'),
    });
    return (
        <View style={mockStyles.overlay}>
            <View style={mockStyles.modal}>
                <Text style={mockStyles.title}>Editar Perfil</Text>
                <Formik
                    initialValues={{ nome: user?.nome || '', email: user?.email || '' }}
                    validationSchema={perfilSchema}
                    onSubmit={async (values, { setSubmitting }) => {
                        try {
                            await updateDoc(doc(db, 'usuarios', user.id), {
                                nome: values.nome,
                                email: values.email,
                            });
                            setUser({ ...user, nome: values.nome, email: values.email });
                            Alert.alert('Sucesso', 'Perfil atualizado!');
                            onClose();
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível salvar o perfil.');
                        } finally {
                            setSubmitting(false);
                        }
                    }}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isValid, dirty, isSubmitting }) => (
                        <>
                            <Text style={{ alignSelf: 'flex-start', fontWeight: 'bold', marginBottom: 4 }}>Nome</Text>
                            <TextInput
                                value={values.nome}
                                onChangeText={handleChange('nome')}
                                onBlur={handleBlur('nome')}
                                style={[mockStyles.input, errors.nome && touched.nome ? { borderColor: 'red', borderWidth: 1 } : {}]}
                                placeholder="Nome"
                                autoCapitalize="words"
                            />
                            {typeof errors.nome === 'string' && touched.nome && <Text style={{ color: 'red', marginBottom: 8 }}>{errors.nome}</Text>}
                            <Text style={{ alignSelf: 'flex-start', fontWeight: 'bold', marginBottom: 4 }}>E-mail</Text>
                            <TextInput
                                value={values.email}
                                onChangeText={handleChange('email')}
                                onBlur={handleBlur('email')}
                                style={[mockStyles.input, errors.email && touched.email ? { borderColor: 'red', borderWidth: 1 } : {}]}
                                placeholder="E-mail"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            {typeof errors.email === 'string' && touched.email && <Text style={{ color: 'red', marginBottom: 8 }}>{errors.email}</Text>}
                            <TouchableOpacity
                                style={[mockStyles.button, { opacity: isValid && dirty && !isSubmitting ? 1 : 0.5, marginTop: 12 }]}
                                onPress={handleSubmit as any}
                                disabled={!(isValid && dirty) || isSubmitting}
                            >
                                <Text style={mockStyles.buttonText}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[mockStyles.button, { backgroundColor: '#888', marginTop: 12 }]} onPress={onClose}>
                                <Text style={mockStyles.buttonText}>Cancelar</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </Formik>
            </View>
        </View>
    );
}

function MockModal({ title, onClose }: { title: string, onClose: () => void }) {
    return (
        <View style={mockStyles.overlay}>
            <View style={mockStyles.modal}>
                <Text style={mockStyles.title}>{title}</Text>
                <Text style={mockStyles.desc}>Tela de configurações "{title}" (mockup). Implemente os controles reais aqui.</Text>
                <TouchableOpacity style={mockStyles.button} onPress={onClose}>
                    <Text style={mockStyles.buttonText}>Fechar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function PreferencesModal({ user, onClose }: { user: any, onClose: () => void }) {
    const [modal, setModal] = useState<'horario' | 'whats' | null>(null);
    const [horarios, setHorarios] = useState({ inicio: '08:00', fim: '18:00' });
    const [msgWhats, setMsgWhats] = useState('');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function fetchPrefs() {
            if (!user?.idSalao) return;
            const snap = await getDoc(doc(db, 'saloes', user.idSalao));
            const d = snap.data();
            if (d?.horarios) setHorarios(d.horarios);
            if (d?.msgWhats) setMsgWhats(d.msgWhats);
            setLoading(false);
        }
        fetchPrefs();
    }, [user?.idSalao]);
    return (
        <View style={mockStyles.overlay}>
            <View style={mockStyles.modal}>
                <Text style={mockStyles.title}>Preferências</Text>
                {modal === null && !loading && (
                    <>
                        <TouchableOpacity style={styles.card} onPress={() => setModal('horario')}>
                            <View style={styles.iconWrapper}><Feather name="clock" size={22} color="#1976d2" /></View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>Horário de Funcionamento</Text>
                                <Text style={styles.cardDesc}>{horarios.inicio} às {horarios.fim}</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#888" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.card} onPress={() => setModal('whats')}>
                            <View style={styles.iconWrapper}><Feather name="message-circle" size={22} color="#1976d2" /></View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>Mensagem WhatsApp</Text>
                                <Text style={styles.cardDesc} numberOfLines={2}>{msgWhats ? msgWhats : 'Não definida'}</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#888" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[mockStyles.button, { backgroundColor: '#888', marginTop: 18 }]} onPress={onClose}>
                            <Text style={mockStyles.buttonText}>Fechar</Text>
                        </TouchableOpacity>
                    </>
                )}
                {modal === 'horario' && (
                    <EditHorarioModal user={user} horarios={horarios} setHorarios={setHorarios} onBack={() => setModal(null)} />
                )}
                {modal === 'whats' && (
                    <EditWhatsModal user={user} msgWhats={msgWhats} setMsgWhats={setMsgWhats} onBack={() => setModal(null)} />
                )}
                {loading && <Text style={{ color: '#888', marginTop: 24 }}>Carregando...</Text>}
            </View>
        </View>
    );
}

function EditHorarioModal({ user, horarios, setHorarios, onBack }: { user: any, horarios: any, setHorarios: (h: any) => void, onBack: () => void }) {
    const horariosSchema = Yup.object().shape({
        inicio: Yup.string().required('Horário inicial obrigatório').matches(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
        fim: Yup.string().required('Horário final obrigatório').matches(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    });
    return (
        <Formik
            initialValues={horarios}
            validationSchema={horariosSchema}
            onSubmit={async (values, { setSubmitting }) => {
                try {
                    await updateDoc(doc(db, 'saloes', user.idSalao), { horarios: values });
                    setHorarios(values);
                    Alert.alert('Sucesso', 'Horários atualizados!');
                    onBack();
                } catch (e) {
                    Alert.alert('Erro', 'Não foi possível salvar.');
                } finally {
                    setSubmitting(false);
                }
            }}
            enableReinitialize
        >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isValid, dirty, isSubmitting }) => (
                <View style={{ width: '100%' }}>
                    <Text style={mockStyles.title}>Editar Horário</Text>
                    <TextInput
                        value={values.inicio}
                        onChangeText={handleChange('inicio')}
                        onBlur={handleBlur('inicio')}
                        style={[mockStyles.input, errors.inicio && touched.inicio ? { borderColor: 'red', borderWidth: 1 } : {}]}
                        placeholder="Início (ex: 08:00)"
                        keyboardType="numeric"
                    />
                    {typeof errors.inicio === 'string' && touched.inicio && <Text style={{ color: 'red', marginBottom: 8 }}>{errors.inicio}</Text>}
                    <TextInput
                        value={values.fim}
                        onChangeText={handleChange('fim')}
                        onBlur={handleBlur('fim')}
                        style={[mockStyles.input, errors.fim && touched.fim ? { borderColor: 'red', borderWidth: 1 } : {}]}
                        placeholder="Fim (ex: 18:00)"
                        keyboardType="numeric"
                    />
                    {typeof errors.fim === 'string' && touched.fim && <Text style={{ color: 'red', marginBottom: 8 }}>{errors.fim}</Text>}
                    <TouchableOpacity
                        style={[mockStyles.button, { opacity: isValid && dirty && !isSubmitting ? 1 : 0.5, marginTop: 12 }]}
                        onPress={handleSubmit as any}
                        disabled={!(isValid && dirty) || isSubmitting}
                    >
                        <Text style={mockStyles.buttonText}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[mockStyles.button, { backgroundColor: '#888', marginTop: 12 }]} onPress={onBack}>
                        <Text style={mockStyles.buttonText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            )}
        </Formik>
    );
}

function EditWhatsModal({ user, msgWhats, setMsgWhats, onBack }: { user: any, msgWhats: string, setMsgWhats: (m: string) => void, onBack: () => void }) {
    const [value, setValue] = useState(msgWhats);
    const [loading, setLoading] = useState(false);
    return (
        <View style={{ width: '100%' }}>
            <Text style={mockStyles.title}>Editar Mensagem WhatsApp</Text>
            <TextInput
                value={value}
                onChangeText={setValue}
                style={[mockStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                multiline
                numberOfLines={4}
                placeholder="Mensagem padrão para WhatsApp"
            />
            <TouchableOpacity
                style={[mockStyles.button, { marginTop: 12 }]}
                onPress={async () => {
                    setLoading(true);
                    try {
                        await updateDoc(doc(db, 'saloes', user.idSalao), { msgWhats: value });
                        setMsgWhats(value);
                        Alert.alert('Sucesso', 'Mensagem atualizada!');
                        onBack();
                    } catch (e) {
                        Alert.alert('Erro', 'Não foi possível salvar.');
                    } finally {
                        setLoading(false);
                    }
                }}
                disabled={loading || value === msgWhats}
            >
                <Text style={mockStyles.buttonText}>{loading ? 'Salvando...' : 'Salvar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[mockStyles.button, { backgroundColor: '#888', marginTop: 12 }]} onPress={onBack}>
                <Text style={mockStyles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
        </View>
    );
}

const DIAS_SEMANA = [
    { key: 'segunda', label: 'Segunda' },
    { key: 'terca', label: 'Terça' },
    { key: 'quarta', label: 'Quarta' },
    { key: 'quinta', label: 'Quinta' },
    { key: 'sexta', label: 'Sexta' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' },
];

const horarioStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    diaLabel: { width: 70, fontSize: 14, color: '#222' },
    input: { width: 60, fontSize: 14, backgroundColor: '#f5f5f5', borderRadius: 6, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 8, paddingVertical: 4, marginHorizontal: 4 },
    check: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
    salvar: { flex: 1, backgroundColor: '#1976d2', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginRight: 8 },
    cancelar: { flex: 1, backgroundColor: '#888', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
    salvarText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    cancelarText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});

function HorarioFuncionamentoModal({ user, onClose }: { user: any, onClose: () => void }) {
    const [dias, setDias] = useState(() => DIAS_SEMANA.map((d, i) => ({
        dia: d.key,
        label: d.label,
        ativo: i < 6,
        inicio: '08:00',
        fim: '18:00',
    })));
    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);
    useEffect(() => {
        async function fetchHorario() {
            if (!user?.idSalao) return setLoading(false);
            const ref = doc(db, 'configuracoes', `horario_funcionamento_${user.idSalao}`);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data();
                if (Array.isArray(data.dias)) {
                    setDias(data.dias.map((d: any, i: number) => ({
                        dia: d.dia,
                        label: DIAS_SEMANA[i]?.label || d.dia,
                        ativo: d.ativo,
                        inicio: d.inicio,
                        fim: d.fim,
                    })));
                }
            }
            setLoading(false);
        }
        fetchHorario();
    }, [user?.idSalao]);

    function handleToggleDia(idx: number) {
        setDias(ds => ds.map((d, i) => i === idx ? { ...d, ativo: !d.ativo } : d));
    }
    function handleChangeHora(idx: number, campo: 'inicio' | 'fim', valor: string) {
        setDias(ds => ds.map((d, i) => i === idx ? { ...d, [campo]: valor } : d));
    }
    async function handleSalvar() {
        if (!user?.idSalao) return;
        setSalvando(true);
        const ref = doc(db, 'configuracoes', `horario_funcionamento_${user.idSalao}`);
        await setDoc(ref, { dias });
        setSalvando(false);
        Alert.alert('Sucesso', 'Horário de funcionamento salvo!');
        onClose();
    }
    return (
        <View style={mockStyles.overlay}>
            <View style={[mockStyles.modal, { maxHeight: '90%', paddingBottom: 0 }]}>
                <Text style={mockStyles.title}>Horário de Funcionamento</Text>
                {loading ? (
                    <Text style={{ color: '#888', marginTop: 24 }}>Carregando...</Text>
                ) : (
                    <>
                        <ScrollView style={{ width: '100%', maxHeight: 340 }} contentContainerStyle={{ paddingBottom: 12 }}>
                            {dias.map((d, idx) => (
                                <View key={d.dia} style={horarioStyles.row}>
                                    <TouchableOpacity onPress={() => handleToggleDia(idx)}>
                                        <View style={[horarioStyles.check, { borderColor: d.ativo ? '#1976d2' : '#ccc', backgroundColor: d.ativo ? '#1976d2' : '#fff' }]}>
                                            {d.ativo && <Feather name="check" size={15} color="#fff" />}
                                        </View>
                                    </TouchableOpacity>
                                    <Text style={horarioStyles.diaLabel}>{d.label}</Text>
                                    <TextInput
                                        value={d.inicio}
                                        onChangeText={v => handleChangeHora(idx, 'inicio', v)}
                                        style={[horarioStyles.input, { opacity: d.ativo ? 1 : 0.5 }]}
                                        placeholder="08:00"
                                        editable={d.ativo}
                                        keyboardType="numeric"
                                        maxLength={5}
                                    />
                                    <Text style={{ fontSize: 13, marginHorizontal: 2 }}>às</Text>
                                    <TextInput
                                        value={d.fim}
                                        onChangeText={v => handleChangeHora(idx, 'fim', v)}
                                        style={[horarioStyles.input, { opacity: d.ativo ? 1 : 0.5 }]}
                                        placeholder="18:00"
                                        editable={d.ativo}
                                        keyboardType="numeric"
                                        maxLength={5}
                                    />
                                </View>
                            ))}
                        </ScrollView>
                        <View style={horarioStyles.footer}>
                            <TouchableOpacity
                                style={[horarioStyles.salvar, { opacity: salvando ? 0.5 : 1 }]}
                                onPress={handleSalvar}
                                disabled={salvando}
                            >
                                <Text style={horarioStyles.salvarText}>{salvando ? 'Salvando...' : 'Salvar'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={horarioStyles.cancelar} onPress={onClose}>
                                <Text style={horarioStyles.cancelarText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </View>
    );
}

const EXEMPLO_CONFIRMACAO = `Olá [NOME]! 😊 Seu agendamento para [SERVIÇO] com [PROFISSIONAL] está confirmado para o dia [DATA] às [HORA]. Qualquer dúvida, estamos à disposição. 💇‍♀️✨ Endereço: [ENDEREÇO]`;
const EXEMPLO_LEMBRETE = `Oi [NOME], tudo bem? Só passando pra lembrar do seu agendamento amanhã! 📍 [SERVIÇO] com [PROFISSIONAL] 📅 Data: [DATA] ⏰ Horário: [HORA] Qualquer mudança é só nos avisar com antecedência 💖 Endereço: [ENDEREÇO]`;

export function MensagensWhatsappModal({ user, onClose }: { user: any, onClose: () => void }) {
    const TAGS_WHATS = [
        { tag: '[NOME]', desc: 'Nome do cliente' },
        { tag: '[SERVIÇO]', desc: 'Nome do serviço agendado' },
        { tag: '[PROFISSIONAL]', desc: 'Nome do profissional que atenderá' },
        { tag: '[DATA]', desc: 'Data do agendamento' },
        { tag: '[HORA]', desc: 'Horário do agendamento' },
        { tag: '[ENDEREÇO]', desc: 'Endereço do seu estabelecimento' },
    ];
    const [mensagens, setMensagens] = useState({ confirmacao: '', lembrete: '' });
    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [abaAtiva, setAbaAtiva] = useState<'confirmacao' | 'lembrete'>('confirmacao');

    const confirmacaoRef = useRef<TextInput>(null);
    const lembreteRef = useRef<TextInput>(null);

    useEffect(() => {
        async function fetchMsgs() {
            if (!user?.idSalao) {
                setMensagens({ confirmacao: EXEMPLO_CONFIRMACAO, lembrete: EXEMPLO_LEMBRETE });
                setLoading(false);
                return;
            }
            const ref = doc(db, 'configuracoes', `mensagensWhatsapp_${user.idSalao}`);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data();
                setMensagens({
                    confirmacao: data.confirmacao || EXEMPLO_CONFIRMACAO,
                    lembrete: data.lembrete || EXEMPLO_LEMBRETE,
                });
            } else {
                setMensagens({ confirmacao: EXEMPLO_CONFIRMACAO, lembrete: EXEMPLO_LEMBRETE });
            }
            setLoading(false);
        }
        fetchMsgs();
    }, [user?.idSalao]);

    function handleInsertTag(tag: string) {
        const textInputRef = abaAtiva === 'confirmacao' ? confirmacaoRef.current : lembreteRef.current;
        if (!textInputRef) return;
        textInputRef.focus();
        setMensagens(prev => {
            const currentValue = prev[abaAtiva];
            const newText = currentValue + tag;
            return { ...prev, [abaAtiva]: newText };
        });
    }

    async function handleSalvar() {
        if (!user?.idSalao) return;
        Keyboard.dismiss();
        setSalvando(true);
        const ref = doc(db, 'configuracoes', `mensagensWhatsapp_${user.idSalao}`);
        try {
            await setDoc(ref, mensagens, { merge: true });
            Alert.alert('Sucesso!', 'Suas mensagens foram salvas.');
            onClose();
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível salvar as mensagens.');
        } finally {
            setSalvando(false);
        }
    }

    const renderContent = () => {
        if (loading) {
            return <ActivityIndicator size="large" color="#1976d2" style={{ flex: 1 }} />;
        }

        const activeRef = abaAtiva === 'confirmacao' ? confirmacaoRef : lembreteRef;
        const activeValue = mensagens[abaAtiva];
        const activePlaceholder = abaAtiva === 'confirmacao' ? EXEMPLO_CONFIRMACAO : EXEMPLO_LEMBRETE;

        return (
            <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 20 }}>
                <TextInput
                    ref={activeRef}
                    value={activeValue}
                    onChangeText={text => setMensagens(m => ({ ...m, [abaAtiva]: text }))}
                    style={styles.textInput}
                    multiline
                    placeholder={activePlaceholder}
                    textAlignVertical="top"
                />
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>O que são as variáveis?</Text>
                    <Text style={styles.infoText}>
                        As variáveis (ex: [NOME]) são substituídas automaticamente pelas informações corretas do agendamento quando a mensagem é enviada.
                    </Text>
                </View>
                <View>
                    <Text style={styles.sectionTitle}>Clique para adicionar:</Text>
                    <View style={styles.tagsContainer}>
                        {TAGS_WHATS.map(({ tag }) => (
                            <TouchableOpacity key={tag} style={styles.tagChip} onPress={() => handleInsertTag(tag)}>
                                <Text style={styles.tagChipText}>{tag}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        );
    };

    return (
        <View style={styles.overlay}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Mensagens Automáticas</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>X</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.tabBar}>
                        <TouchableOpacity
                            style={[styles.tabButton, abaAtiva === 'confirmacao' && styles.tabButtonActive]}
                            onPress={() => setAbaAtiva('confirmacao')}
                        >
                            <Text style={[styles.tabText, abaAtiva === 'confirmacao' && styles.tabTextActive]}>📩 Confirmação</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabButton, abaAtiva === 'lembrete' && styles.tabButtonActive]}
                            onPress={() => setAbaAtiva('lembrete')}
                        >
                            <Text style={[styles.tabText, abaAtiva === 'lembrete' && styles.tabTextActive]}>⏰ Lembrete</Text>
                        </TouchableOpacity>
                    </View>
                    {renderContent()}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSalvar} disabled={salvando}>
                            {salvando ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Salvar Alterações</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 16 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
    optionsContainer: { marginTop: 8 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        elevation: 1,
    },
    iconWrapper: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#e3eaff', alignItems: 'center', justifyContent: 'center', marginRight: 16,
    },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#222' },
    cardDesc: { fontSize: 13, color: '#666', marginTop: 2 },
    scrollContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
    textInput: {
        height: 180,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        marginBottom: 16,
    },
    infoSection: { marginBottom: 16, backgroundColor: '#f0f4ff', padding: 12, borderRadius: 8 },
    sectionTitle: { fontWeight: 'bold', marginBottom: 8, fontSize: 15, color: '#333' },
    infoText: { fontSize: 13, color: '#555', lineHeight: 18 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    tagChip: {
        backgroundColor: '#e0e0e0',
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    tagChipText: { fontSize: 13, color: '#333' },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: 'white',
        height: '90%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    closeButton: { padding: 8 },
    closeButtonText: { fontSize: 18, fontWeight: 'bold' },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
    },
    tabButtonActive: {
        borderBottomWidth: 3,
        borderBottomColor: '#1976d2',
    },
    tabText: { color: '#888', fontWeight: '500' },
    tabTextActive: { color: '#1976d2', fontWeight: 'bold' },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    saveButton: {
        backgroundColor: '#1976d2',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

const mockStyles = StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    modal: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    desc: { fontSize: 15, color: '#555', marginBottom: 24, textAlign: 'center' },
    button: { backgroundColor: '#1976d2', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32, width: '100%' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 15,
        fontSize: 16,
    },
});