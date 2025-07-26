import { GoogleSignin } from '@react-native-google-signin/google-signin';

// webClientId deve ser o Client ID do tipo "OAuth 2.0 para cliente da Web" do seu projeto Firebase
// Encontre em: Console Firebase > Configurações do Projeto > Contas de Serviço > Client ID da Web
export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: '108734211856-1tibldqfo3mvnad72p1s9m47dpt0si75.apps.googleusercontent.com',
    offlineAccess: false,
  });
} 