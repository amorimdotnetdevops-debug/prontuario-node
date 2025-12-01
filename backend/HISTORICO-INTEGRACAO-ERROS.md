# Histórico de Padronização de Erros e Integração Front-End

Este arquivo registra as decisões e passos implementados para padronizar respostas de erro do backend e facilitar a integração no front-end.

## Contrato de Erro
- Formato padrão de resposta: `{"message": string, "code"?: ErrorCode}`
- Enum centralizado de códigos: `ErrorCode`

Referências:
- `src/application/dtos/common/error-response.dto.ts:3` define `ErrorCode`
- `src/application/dtos/common/error-response.dto.ts:15` define `ErrorResponseDto`

## Filtro Global de Erros
- Captura exceções (`HttpException` e genéricas) e normaliza para o contrato.
- Mapeia `status/mensagem` para `ErrorCode` quando não fornecido.

Referências:
- `src/infrastructure/common/filters/unified-error.filter.ts:12` registra o filtro
- `src/infrastructure/common/filters/unified-error.filter.ts:57` resolve `code` por `status/mensagem`

## Guards e Estratégias
- `JwtGuard` lança `UnauthorizedException` com `code=AUTH_UNAUTHORIZED`.
- `JwtRefreshGuard` lança `UnauthorizedException` com `code=AUTH_REFRESH_INVALID`.
- `RefreshJwtStrategy` valida `type=refresh` e lança erro com código quando inválido.

Referências:
- `src/infrastructure/common/guards/jwt.guard.ts:13`
- `src/infrastructure/common/guards/jwt-refresh.guard.ts:10`
- `src/application/strategies/refresh-jwt.strategy.ts:23`

## Inicialização do App e Swagger
- `PORT` configurável via env; Swagger `servers` usam a porta dinâmica.
- Prefixo global: `api/v1`.

Referências:
- `src/main.ts:26` leitura de `PORT`
- `src/main.ts:35` `addServer` com porta dinâmica
- `src/main.ts:46` `listen(port)`

## Mapeamento ErrorCode → Mensagem (pt-BR)
- `AUTH_INVALID_CREDENTIALS`: Email ou senha inválidos
- `AUTH_REFRESH_INVALID`: Refresh token inválido
- `AUTH_UNAUTHORIZED`: Sessão expirada ou não autorizada
- `AUTH_TOKEN_INVALID`: Token inválido ou expirado
- `VALIDATION_ERROR`: Dados inválidos
- `BAD_REQUEST`: Requisição inválida
- `NOT_FOUND`: Recurso não encontrado
- `INTERNAL_ERROR`: Erro interno, tente novamente
- `USER_NOT_FOUND`: Usuário não encontrado
- `USER_EMAIL_CONFLICT`: Este email já está em uso

## Middleware Axios (Front-End)
### Objetivo
- Normalizar erros, exibir mensagens amigáveis e realizar auto-refresh em 401 sem duplicar múltiplas requisições.

### Instância
```ts
import { createApiClient, createMemoryTokenStorage } from './api';

const tokens = createMemoryTokenStorage();
export const api = createApiClient(import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1', {
  tokenStorage: tokens,
  locale: 'pt',
});
```

### Uso
```ts
// Login
const { data } = await api.post('/auth/login', { email, password });
tokens.setAccessToken(data.accessToken);
tokens.setRefreshToken(data.refreshToken);

// Chamada autenticada
try {
  const { data } = await api.get('/auth/me');
  // ...
} catch (e: any) {
  // e.message, e.code, e.status disponíveis
}
```

### Auto-Refresh (401)
- Em `401/AUTH_UNAUTHORIZED/AUTH_TOKEN_INVALID`, a instância tenta `POST /auth/refresh` usando `refreshToken`.
- Requisições em andamento ficam em fila e são re-executadas após obter novo `accessToken`.
- Falha no refresh limpa tokens e retorna erro normalizado.

## Integrações Úteis
- React Query: `QueryClientProvider` e `fetcher` baseado em `api.get`.
- Estado de tokens: `Zustand` ou `Redux Toolkit` com persistência.
- Vue Pinia: `useApi` que injeta interceptors e persiste tokens.

## Boas Práticas
- Tratar `401` globalmente: redirecionar ao login ou mostrar aviso de sessão expirada.
- Usar `code` para tradução; `message` como fallback.
- Logar erro bruto apenas em desenvolvimento.

## Execução do Backend (Dev)
- Variar porta para evitar conflito: `PORT=3001 npm run start:dev`
- Base URL do front: `http://localhost:3001/api/v1`

