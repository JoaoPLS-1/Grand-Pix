# 📦 Guia de Deploy no Netlify

## Alterações Realizadas

### 1. **Correção de Imports** ✅
- Corrigidos todos os imports para usar caminhos alias (`@/`)
- Arquivos corrigidos:
  - `pages/_app.tsx`
  - `pages/index.tsx`
  - `pages/api/*.ts` (todos os arquivos de API)
  - `components/RejectionList.tsx`

### 2. **Configuração do Next.js** ✅
- Desabilitado React Compiler para reduzir uso de memória durante build
- Adicionadas otimizações de memória webpack
- Atualizado `next.config.ts`

### 3. **Arquivo netlify.toml** ✅
- Criado `netlify.toml` com configuração apropriada:
  - Comando de build: `npm run build`
  - Diretório de publicação: `.next`
  - Redirecionamento de rotas SPA

### 4. **Arquivo _redirects** ✅
- Criado para reencaminhar todas as rotas para `index.html`
- Necessário para SPA (Single Page Application)

## 🚀 Como Fazer Deploy no Netlify

### Opção 1: Deploy via GitHub (Recomendado)

1. **Faça push do repositório para GitHub:**
   ```bash
   git add .
   git commit -m "Preparado para deploy no Netlify"
   git push origin main
   ```

2. **No Netlify:**
   - Acesse [netlify.com](https://netlify.com)
   - Clique em "Add new site" > "Import an existing project"
   - Selecione "GitHub"
   - Autorize e selecione o repositório
   - Configuração automática (o netlify.toml será detectado)
   - Clique em "Deploy"

### Opção 2: Deploy Manual

1. **Gere o build localmente:**
   ```bash
   npm run build
   ```

2. **Compacte a pasta `.next`:**
   ```bash
   7z a build.zip .next\
   ```

3. **Faça upload no Netlify:**
   - Acesse o site do Netlify
   - Arraste e solte a pasta `.next` ou o arquivo zipado

## ⚙️ Variáveis de Ambiente

A aplicação usa credenciais do Supabase que estão hardcoded em `lib/supabase.ts`. Se necessário adicionar variáveis de ambiente no Netlify:

1. Vá para **Site settings** > **Build & deploy** > **Environment**
2. Clique em **Edit variables**
3. Adicione as variáveis necessárias

## 🔍 Verificações Pré-Deploy

- ✅ Build local funciona: `npm run build`
- ✅ Sem erros TypeScript
- ✅ Todos os imports corrigidos
- ✅ netlify.toml presente
- ✅ .next gerado com sucesso

## 📋 Status Final

| Item | Status |
|------|--------|
| Build TypeScript | ✅ Sucesso |
| Imports | ✅ Corrigido |
| Configuração Netlify | ✅ Pronto |
| Redirecionamento de rotas | ✅ Configurado |
| Créditos Supabase | ✅ Inclusos |

---

**Próximos passos:** Faça o commit dessas mudanças e inicie o deploy no Netlify!
