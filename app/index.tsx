import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../contexts/useAuthStore';
import { useSalaoInfo } from '../hooks/useSalaoInfo';

export default function Index() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const { salaoInfo, loading: isSalaoLoading } = useSalaoInfo();

  console.log('Index - Componente montado', { user, salaoInfo, isLoading, isSalaoLoading });

  useEffect(() => {
    console.log('Index - useEffect executado', { 
      user: user ? { id: user.id, idSalao: user.idSalao } : null, 
      salaoInfo, 
      isLoading, 
      isSalaoLoading 
    });
    console.log('Index - Dependências do useEffect:', { 
      userExists: !!user, 
      user_idSalao: user?.idSalao,
      salaoInfoExists: !!salaoInfo,
      isLoading,
      isSalaoLoading
    });
    
    // Aguarda um pouco para garantir que o layout está montado
    const timer = setTimeout(() => {
      console.log('Index - Timer executado', { user, salaoInfo, isLoading, isSalaoLoading });
      
      if (isLoading) {
        console.log('Index - Auth ainda carregando, aguardando...');
        return;
      }

      console.log('Index - Verificando estado do usuário:', { 
        user: user ? { id: user.id, idSalao: user.idSalao, role: user.role } : null, 
        salaoInfo: salaoInfo ? { id: salaoInfo.id, plano: salaoInfo.plano } : null,
        isSalaoLoading 
      });
      
      // Logs detalhados para debug
      console.log('Index - Condições de redirecionamento:');
      console.log('- user existe:', !!user);
      console.log('- user.idSalao:', user?.idSalao);
      console.log('- salaoInfo existe:', !!salaoInfo);
      console.log('- salaoInfo.plano:', salaoInfo?.plano);
      console.log('- isSalaoLoading:', isSalaoLoading);

      if (!user) {
        console.log('Index - Usuário não logado, redirecionando para login');
        (router as any).replace('/login');
      } else if (user && !user.idSalao) {
        console.log('Index - Usuário sem salão, redirecionando para cadastro');
        (router as any).replace('/cadastro-salao');
      } else if (user && user.idSalao && salaoInfo?.plano) {
        // Se o usuário tem salão e plano, vai direto para o app
        console.log('Index - Usuário com salão e plano, redirecionando para app');
        console.log('Index - Dados do salão:', { id: salaoInfo.id, plano: salaoInfo.plano });
        (router as any).replace('/(tabs)/agenda');
      } else if (user && user.idSalao && !salaoInfo?.plano && !isSalaoLoading) {
        // Se o usuário tem salão mas não tem plano, vai para seleção de plano
        console.log('Index - Usuário com salão mas sem plano, redirecionando para seleção');
        (router as any).replace('/selecao-plano');
      } else if (user && user.idSalao && isSalaoLoading) {
        // Se ainda está carregando as informações do salão, aguarda
        console.log('Index - Aguardando carregamento das informações do salão');
        return;
      } else {
        console.log('Index - Nenhuma condição atendida, redirecionando para login');
        (router as any).replace('/login');
      }
    }, 1000); // Aumentado para 1 segundo

    return () => clearTimeout(timer);
  }, [user, user?.idSalao, salaoInfo, isLoading, isSalaoLoading, router]);

  // Retorna null para não mostrar nada durante o redirecionamento
  return null;
} 