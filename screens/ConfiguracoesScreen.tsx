import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { Formik } from 'formik';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Yup from 'yup';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { CustomHeader } from '../components/CustomHeader';
import { useAuthStore } from '../contexts/useAuthStore';
import { useSubmit } from '../hooks/useSubmit';
import { db } from '../services/firebase';

const configOptions = [
    { key: 'payments', icon: 'credit-card', title: 'Formas de Pagamento', description: 'Gerencie as formas de pagamento' },
    { key: 'subscription', icon: 'settings', title: 'Gerenciar Assinatura', description: 'Verificar status, alterar plano, cancelar' },
    { key: 'privacy', icon: 'shield', title: 'Privacidade e Dados', description: 'Exportar dados, portabilidade e exclusão de conta' },
    { key: 'terms', icon: 'file-text', title: 'Termos de Uso e Política de Privacidade', description: 'Visualizar e gerenciar consentimentos' },
    { key: 'logout', icon: 'log-out', title: 'Sair', description: 'Encerrar sessão' },
];

export const ConfiguracoesScreen = memo(() => {
    const [modal, setModal] = useState<string | null>(null);
    const { user, setUser, logout } = useAuthStore();
    console.log('CONFIGURACOES user:', user);
    const router = useRouter();

    // Função para migrar mensagens de todos os salões existentes
    const migrarMensagensGlobais = useCallback(async () => {
        if (!user?.idSalao) return;
        
        try {
            console.log('Iniciando migração global de mensagens...');
            
            // Buscar todos os documentos na coleção 'configuracoes' que começam com 'mensagensWhatsapp_'
            const configuracoesRef = collection(db, 'configuracoes');
            const q = query(configuracoesRef, where('__name__', '>=', 'mensagensWhatsapp_'), where('__name__', '<=', 'mensagensWhatsapp_\uf8ff'));
            const snapshot = await getDocs(q);
            
            let migrados = 0;
            for (const docSnapshot of snapshot.docs) {
                const salaoId = docSnapshot.id.replace('mensagensWhatsapp_', '');
                const data = docSnapshot.data();
                
                if (data.confirmacao || data.lembrete) {
                    // Salvar na estrutura correta
                    const refCorreto = doc(db, 'saloes', salaoId, 'configuracoes', 'mensagensWhatsapp');
                    await setDoc(refCorreto, {
                        confirmacao: data.confirmacao || EXEMPLO_CONFIRMACAO,
                        lembrete: data.lembrete || EXEMPLO_LEMBRETE,
                    }, { merge: true });
                    
                    // Deletar do local antigo
                    await deleteDoc(docSnapshot.ref);
                    migrados++;
                    console.log(`Migrado salão: ${salaoId}`);
                }
            }
            
            console.log(`Migração concluída! ${migrados} salões migrados.`);
            Alert.alert('Dados do aplicativo atualizados com sucesso!', `${migrados} salões foram migrados com sucesso!`);
            
        } catch (error) {
            console.error('Erro na migração global:', error);
            Alert.alert('Erro', 'Ocorreu um erro ao atualizar os dados do aplicativo. Por favor, feche e abra o app novamente. Se o erro persistir, entre em contato com o suporte.');
        }
    }, [user?.idSalao]);

    const handleOptionPress = useCallback((key: string) => {
        if (key === 'logout') {
            Alert.alert(
                'Sair',
                'Tem certeza que deseja sair?',
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                    },
                    {
                        text: 'Sair',
                        style: 'destructive',
                        onPress: async () => {
                            await logout();
                            router.replace('/login');
                        },
                    },
                ]
            );
            return;
        }
        if (key === 'payments') {
            router.push('/pagamentos');
            return;
        }
        if (key === 'subscription') {
            router.push('/gerenciar-assinatura');
            return;
        }
        if (key === 'privacy') {
            router.push('/privacidade');
            return;
        }
        if (key === 'terms') {
            router.push('/termos-privacidade');
            return;
        }
        if (key === 'migrate') {
            migrarMensagensGlobais();
            return;
        }
        setModal(key);
    }, [logout, router, migrarMensagensGlobais]);

    const handlePerfilPress = useCallback(() => {
        router.push({ pathname: '/ContaScreen', params: { user: JSON.stringify(user) } });
    }, [router, user]);

    const handleHorarioPress = useCallback(() => {
        router.push({ pathname: '/HorarioFuncionamentoScreen', params: { user } });
    }, [router, user]);

    const handleMensagensPress = useCallback(() => {
        router.push({ pathname: '/mensagens', params: { user: JSON.stringify(user) } });
    }, [router, user]);

    const handleSalaoPress = useCallback(() => {
        router.push('/salao');
    }, [router]);

    const renderCard = useCallback(({ key, icon, title, description, onPress, backgroundColor = '#f9f9f9', iconColor = '#1976d2', chevronColor = '#888', iconType = 'feather' }: any) => (
        <TouchableOpacity
            key={key}
            style={[styles.card, { backgroundColor }]}
            onPress={onPress}
            accessibilityLabel={title}
            accessibilityHint={description}
        >
            <View style={[styles.iconWrapper, { backgroundColor: backgroundColor === '#fff3cd' ? '#fff3cd' : '#e3eaff' }]}>
                {iconType === 'fontawesome5' ? (
                    <FontAwesome5 name={icon} size={hp('3%')} color={iconColor} />
                ) : (
                    <Feather name={icon} size={hp('3%')} color={iconColor} />
                )}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardDesc}>{description}</Text>
            </View>
            <Feather name="chevron-right" size={hp('2.75%')} color={chevronColor} />
        </TouchableOpacity>
    ), []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <CustomHeader title="Configurações" showBackButton={false} />
            <ConnectionStatus />
            <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
                {/* Perfil (unificado) */}
                {renderCard({
                    key: 'account',
                    icon: 'user',
                    title: 'Perfil',
                    description: 'Gerencie seu nome, e-mail e redefina sua senha.',
                    onPress: handlePerfilPress,
                })}

                {/* Salão */}
                {renderCard({
                    key: 'salao',
                    icon: 'store',
                    title: 'Salão',
                    description: 'Gerencie o nome do salão, telefone e endereço',
                    onPress: handleSalaoPress,
                    iconType: 'fontawesome5',
                })}

                {/* Horário de Funcionamento */}
                {renderCard({
                    key: 'horario',
                    icon: 'clock',
                    title: 'Horário de Funcionamento',
                    description: 'Editar horário de funcionamento do salão',
                    onPress: handleHorarioPress,
                })}

                {/* Mensagens de Confirmação */}
                {renderCard({
                    key: 'whats',
                    icon: 'message-circle',
                    title: 'Mensagens de Confirmação',
                    description: 'Editar mensagem padrão de confirmação do WhatsApp',
                    onPress: handleMensagensPress,
                })}

                {/* Botão de Migração (apenas para administradores) */}
                {user?.role === 'admin' && renderCard({
                    key: 'migrate',
                    icon: 'database',
                    title: 'Migrar Mensagens',
                    description: 'Migrar mensagens de salões existentes para nova estrutura',
                    onPress: () => handleOptionPress('migrate'),
                    backgroundColor: '#fff3cd',
                    iconColor: '#856404',
                    chevronColor: '#856404',
                })}

                {/* Demais opções */}
                {configOptions.map(opt => renderCard({
                    key: opt.key,
                    icon: opt.icon,
                    title: opt.title,
                    description: opt.description,
                    onPress: () => handleOptionPress(opt.key),
                }))}


            </ScrollView>
            {/* Modais fora do ScrollView para overlay correto */}
            {modal === 'notifications' && <MockModal title="Notificações" onClose={() => setModal(null)} />}
            {modal === 'plan' && <MockModal title="Plano" onClose={() => setModal(null)} />}
            {modal === 'export' && <MockModal title="Exportação" onClose={() => setModal(null)} />}
        </SafeAreaView>
    );
});

ConfiguracoesScreen.displayName = 'ConfiguracoesScreen';

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
                            Alert.alert('Erro', 'Falha na conexão. Verifique sua internet e tente novamente.');
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
                    Alert.alert('Erro', 'Falha na conexão. Verifique sua internet e tente novamente.');
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
                        Alert.alert('Erro', 'Falha na conexão. Verifique sua internet e tente novamente.');
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
            const ref = doc(db, 'saloes', user.idSalao, 'configuracoes', 'horarios');
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
        const ref = doc(db, 'saloes', user.idSalao, 'configuracoes', 'horarios');
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
    // Garante que o estado sempre tem as chaves corretas
    const [mensagens, setMensagens] = useState<{ confirmacao: string; lembrete: string }>(() => ({ confirmacao: '', lembrete: '' }));
    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [abaAtiva, setAbaAtiva] = useState<'confirmacao' | 'lembrete'>('confirmacao');
    const [isSubmitting, handleSalvarWrapped] = useSubmit(handleSalvar);

    const confirmacaoRef = useRef<TextInput>(null);
    const lembreteRef = useRef<TextInput>(null);

    useEffect(() => {
        async function fetchMsgs() {
            if (!user || !user.idSalao) {
                setMensagens({ confirmacao: EXEMPLO_CONFIRMACAO, lembrete: EXEMPLO_LEMBRETE });
                setLoading(false);
                return;
            }
            try {
                // Primeiro, tentar buscar da estrutura correta
                const ref = doc(db, 'saloes', user.idSalao, 'configuracoes', 'mensagensWhatsapp');
                const snap = await getDoc(ref);
                
                if (snap.exists()) {
                    const data = snap.data() || {};
                    setMensagens({
                        confirmacao: typeof data.confirmacao === 'string' ? data.confirmacao : EXEMPLO_CONFIRMACAO,
                        lembrete: typeof data.lembrete === 'string' ? data.lembrete : EXEMPLO_LEMBRETE,
                    });
                } else {
                    // Se não existir na estrutura correta, tentar migrar do local antigo
                    console.log('Tentando migrar mensagens do local antigo...');
                    try {
                        const refAntigo = doc(db, 'configuracoes', `mensagensWhatsapp_${user.idSalao}`);
                        const snapAntigo = await getDoc(refAntigo);
                        
                        if (snapAntigo.exists()) {
                            const dataAntigo = snapAntigo.data();
                            const mensagensMigradas = {
                                confirmacao: dataAntigo.confirmacao || EXEMPLO_CONFIRMACAO,
                                lembrete: dataAntigo.lembrete || EXEMPLO_LEMBRETE,
                            };
                            
                            // Salvar na estrutura correta
                            await setDoc(ref, mensagensMigradas, { merge: true });
                            
                            // Deletar do local antigo
                            await deleteDoc(refAntigo);
                            
                            setMensagens(mensagensMigradas);
                            console.log('Migração concluída com sucesso!');
                        } else {
                            setMensagens({ confirmacao: EXEMPLO_CONFIRMACAO, lembrete: EXEMPLO_LEMBRETE });
                        }
                    } catch (error) {
                        console.log('Erro na migração:', error);
                        setMensagens({ confirmacao: EXEMPLO_CONFIRMACAO, lembrete: EXEMPLO_LEMBRETE });
                    }
                }
            } catch (e) {
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
            const currentValue = prev[abaAtiva] || '';
            const newText = currentValue + tag;
            return { ...prev, [abaAtiva]: newText };
        });
    }

    async function handleSalvar() {
        if (!user || !user.idSalao) {
            Alert.alert('Erro', 'Sua sessão pode ter expirado ou houve um erro ao carregar os dados. Por favor, faça o login novamente para continuar.');
            return;
        }
        Keyboard.dismiss();
        setSalvando(true);
        // Corrigido: Salvar na estrutura correta do salão
        const ref = doc(db, 'saloes', user.idSalao, 'configuracoes', 'mensagensWhatsapp');
        try {
            await setDoc(ref, mensagens, { merge: true });
            Alert.alert('Sucesso!', 'Suas mensagens foram salvas.');
            onClose();
        } catch (error) {
            Alert.alert('Erro', 'Falha na conexão. Verifique sua internet e tente novamente.');
        }
    }

    const renderContent = () => {
        if (loading) {
            return <ActivityIndicator size="large" color="#1976d2" style={{ flex: 1 }} />;
        }

        const activeRef = abaAtiva === 'confirmacao' ? confirmacaoRef : lembreteRef;
        const activeValue = mensagens[abaAtiva] || '';
        const activePlaceholder = abaAtiva === 'confirmacao' ? EXEMPLO_CONFIRMACAO : EXEMPLO_LEMBRETE;

        return (
                         <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
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
                        <TouchableOpacity style={styles.saveButton} onPress={handleSalvarWrapped} disabled={isSubmitting}>
                            {isSubmitting ? (
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
    optionsContainer: { 
        marginTop: hp('1%') 
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: wp('2.5%'),
        padding: wp('4%'),
        marginBottom: hp('1.5%'),
        elevation: 1,
    },
    iconWrapper: {
        width: wp('10%'), 
        height: wp('10%'), 
        borderRadius: wp('5%'),
        backgroundColor: '#e3eaff', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginRight: wp('4%'),
    },
    cardTitle: { 
        fontSize: hp('2%'), 
        fontWeight: 'bold', 
        color: '#222' 
    },
    cardDesc: { 
        fontSize: hp('1.625%'), 
        color: '#666', 
        marginTop: hp('0.25%') 
    },
    textInput: {
        height: hp('22.5%'),
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: wp('2%'),
        padding: wp('3%'),
        fontSize: hp('1.875%'),
        marginBottom: hp('2%'),
    },
    infoSection: { 
        marginBottom: hp('2%'), 
        backgroundColor: '#f0f4ff', 
        padding: wp('3%'), 
        borderRadius: wp('2%') 
    },
    sectionTitle: { 
        fontWeight: 'bold', 
        marginBottom: hp('1%'), 
        fontSize: hp('1.875%'), 
        color: '#333' 
    },
    infoText: { 
        fontSize: hp('1.625%'), 
        color: '#555', 
        lineHeight: hp('2.25%') 
    },
    tagsContainer: { 
        flexDirection: 'row', 
        flexWrap: 'wrap' 
    },
    tagChip: {
        backgroundColor: '#e0e0e0',
        borderRadius: wp('4%'),
        paddingVertical: hp('0.75%'),
        paddingHorizontal: wp('3%'),
        marginRight: wp('2%'),
        marginBottom: hp('1%'),
    },
    tagChipText: { 
        fontSize: hp('1.625%'), 
        color: '#333' 
    },
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
        borderTopLeftRadius: wp('5%'),
        borderTopRightRadius: wp('5%'),
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: wp('4%'),
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: { 
        fontSize: hp('2.25%'), 
        fontWeight: 'bold' 
    },
    closeButton: { 
        padding: wp('2%') 
    },
    closeButtonText: { 
        fontSize: hp('2.25%'), 
        fontWeight: 'bold' 
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tabButton: {
        flex: 1,
        paddingVertical: hp('1.75%'),
        alignItems: 'center',
    },
    tabButtonActive: {
        borderBottomWidth: 3,
        borderBottomColor: '#1976d2',
    },
    tabText: { 
        color: '#888', 
        fontWeight: '500' 
    },
    tabTextActive: { 
        color: '#1976d2', 
        fontWeight: 'bold' 
    },
    footer: {
        padding: wp('4%'),
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    saveButton: {
        backgroundColor: '#1976d2',
        borderRadius: wp('2%'),
        padding: wp('4%'),
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: hp('2%'),
    },

});

const mockStyles = StyleSheet.create({
    overlay: { 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.2)', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 10 
    },
    modal: { 
        backgroundColor: '#fff', 
        borderRadius: wp('4%'), 
        padding: wp('6%'), 
        width: '85%', 
        alignItems: 'center' 
    },
    title: { 
        fontSize: hp('2.5%'), 
        fontWeight: 'bold', 
        marginBottom: hp('1.5%') 
    },
    desc: { 
        fontSize: hp('1.875%'), 
        color: '#555', 
        marginBottom: hp('3%'), 
        textAlign: 'center' 
    },
    button: { 
        backgroundColor: '#1976d2', 
        borderRadius: wp('2%'), 
        paddingVertical: hp('1.5%'), 
        paddingHorizontal: wp('8%'), 
        width: '100%' 
    },
    buttonText: { 
        color: '#fff', 
        fontWeight: 'bold', 
        fontSize: hp('2%'), 
        textAlign: 'center' 
    },
    input: {
        width: '100%',
        height: hp('6.25%'),
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: wp('2%'),
        paddingHorizontal: wp('2.5%'),
        marginBottom: hp('1.875%'),
        fontSize: hp('2%'),
    },
});