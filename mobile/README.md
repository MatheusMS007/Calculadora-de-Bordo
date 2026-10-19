# App mobile — Calculadora de Bordo

Aplicativo React Native criado com Expo SDK 58 e Expo Router. As telas usam a API do servidor Node/Express.

O código mobile usa JavaScript: arquivos `.jsx` para telas e componentes com JSX, e `.js` para módulos sem JSX.

## Configurar a API

Copie `.env.example` para `.env` e ajuste `EXPO_PUBLIC_API_URL` para o endereço do servidor, sempre incluindo `/api`:

- Emulador Android: `http://10.0.2.2:3000/api`
- Aparelho físico: use o IP local do computador na rede Wi-Fi, por exemplo `http://192.168.0.10:3000/api`.

O computador e o aparelho precisam alcançar um ao outro pela rede. Reinicie o Expo depois de alterar o `.env`.

## Iniciar

Na pasta `mobile`, rode `npm start` e abra o projeto no Expo Go ou em um emulador.

O token de autenticação é mantido no SecureStore do aparelho. O app tem uma tela de login, um resumo de ganhos e uma aba para consultar e registrar ganhos. A data do registro deve ser informada como `AAAA-MM-DD`.

A aba de ganhos mantém uma cópia local em SQLite para exibir os últimos registros quando a API estiver indisponível. Ao entrar novamente, a lista é atualizada pelo servidor; ao sair da conta, o cache local de ganhos é apagado. O registro de novos ganhos ainda exige conexão com a API.

No resumo, a tela “Informações do dispositivo” mostra dados do sistema operacional e do aparelho localmente, sem enviá-los à API.
