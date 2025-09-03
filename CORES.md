# 🎨 GUIA DE CORES - RICARDO TERNOS

Este arquivo contém todas as cores e variáveis do sistema para facilitar manutenção e consistência.

## 📋 PALETA DE CORES

### Cores Base

- **Preto**: `#000000` → `--color-black`
- **Cinza Escuro**: `#1a1a1a` → `--color-dark-gray`
- **Cinza Médio**: `#2c2c2c` → `--color-medium-gray`
- **Cinza Claro**: `#404040` → `--color-light-gray`
- **Cinza Texto**: `#999999` → `--color-text-gray`
- **Branco**: `#ffffff` → `--color-white`
- **Branco Suave**: `#f0f0f0` → `--color-off-white`

### Dourado (Cor Principal)

- **Dourado Escuro**: `#b8860b` → `--color-gold` ⭐ **COR PRINCIPAL**
- **Dourado Médio**: `#daa520` → `--color-gold-light`
- **Dourado Claro**: `#ffd700` → `--color-gold-lighter`
- **Dourado Transparente**: `rgba(184, 134, 11, 0.15)` → `--color-gold-transparent`
- **Dourado Hover**: `#9a7209` → `--color-gold-hover`

## 🎯 APLICAÇÃO SEMÂNTICA

### Backgrounds

- **Principal**: `--bg-primary` (Cinza escuro para fundo geral)
- **Secundário**: `--bg-secondary` (Cinza médio para cards/superfícies)
- **Terciário**: `--bg-tertiary` (Cinza claro para elementos elevados)
- **Overlay**: `--bg-overlay` (Preto transparente para modais)
- **Card**: `--bg-card` (Mesmo que secundário)

### Texto

- **Principal**: `--text-primary` (Branco suave para texto geral)
- **Secundário**: `--text-secondary` (Cinza para texto de apoio)
- **Destaque**: `--text-accent` (Dourado para títulos e destaques)
- **Contraste**: `--text-contrast` (Preto para texto em fundos claros)
- **Branco**: `--text-white` (Branco puro quando necessário)

### Bordas

- **Principal**: `--border-primary` (Dourado para bordas importantes)
- **Secundária**: `--border-secondary` (Cinza claro para bordas normais)
- **Sutil**: `--border-subtle` (Cinza médio para divisões discretas)

### Interações

- **Primária**: `--interactive-primary` (Dourado para botões principais)
- **Primária Hover**: `--interactive-primary-hover` (Dourado escuro)
- **Secundária**: `--interactive-secondary` (Transparente)
- **Secundária Hover**: `--interactive-secondary-hover` (Dourado transparente)

### Status

- **Sucesso**: `--status-success` (#22c55e)
- **Aviso**: `--status-warning` (#f59e0b)
- **Erro**: `--status-error` (#ef4444)
- **Info**: `--status-info` (Dourado médio)

## 🛠️ COMO USAR

### Em CSS:

```css
.meu-componente {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}
```

### Para Botões:

```css
/* Botão principal */
button {
  background-color: var(--interactive-primary);
  color: var(--text-contrast);
}

/* Botão secundário */
button.secondary {
  background-color: var(--interactive-secondary);
  color: var(--text-accent);
  border: 2px solid var(--border-primary);
}
```

### Para Cards:

```css
.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-medium);
}
```

## 📐 OUTRAS VARIÁVEIS

### Espaçamentos

- `--spacing-xs`: 0.25rem (4px)
- `--spacing-sm`: 0.5rem (8px)
- `--spacing-md`: 1rem (16px)
- `--spacing-lg`: 1.5rem (24px)
- `--spacing-xl`: 2rem (32px)
- `--spacing-2xl`: 3rem (48px)

### Sombras

- `--shadow-small`: Sombra pequena
- `--shadow-medium`: Sombra média
- `--shadow-large`: Sombra grande
- `--shadow-gold`: Sombra dourada

### Transições

- `--transition-fast`: 0.15s ease
- `--transition-normal`: 0.3s ease
- `--transition-slow`: 0.5s ease

### Border Radius

- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 12px
- `--radius-full`: 9999px

---

## 🔧 MANUTENÇÃO

Para alterar qualquer cor do sistema:

1. Edite apenas o arquivo `src/theme.css`
2. Todas as páginas serão atualizadas automaticamente
3. Mantenha a consistência usando as variáveis semânticas

**NUNCA** use cores hardcoded nos componentes. Sempre use as variáveis CSS!
