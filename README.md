<div align="center">

# 📚 مكتبة الأحاديث النبوية
### Bibliothèque des Hadiths Prophétiques

<br/>

**Projet de Fin d'Année (PFA)**

| | |
|---|---|
| 👨‍🎓 **Étudiant** | Riani Ilyes |
| 👨‍🏫 **Encadrant** | Bsir Bassem |

</div>

---

## 🇫🇷 Présentation du projet

**مكتبة الأحاديث النبوية** est une application web moderne dédiée à la **recherche et consultation des hadiths prophétiques**. Elle permet aux utilisateurs de rechercher des hadiths par mots-clés, synonymes ou thématiques, avec une interface intuitive et rapide.

### ✨ Fonctionnalités principales

- 🔍 **Recherche avancée** par mots-clés et synonymes
- 📖 **Consultation des hadiths** avec affichage détaillé
- ⚡ **Recherche en temps réel** via Supabase Edge Functions
- 🗄️ **Base de données structurée** avec migrations versionnées

---

## 🇸🇦 نبذة عن المشروع

**مكتبة الأحاديث النبوية** هي تطبيق ويب حديث مخصص للـ**بحث والاطلاع على الأحاديث النبوية الشريفة**. يتيح للمستخدمين البحث بالكلمات المفتاحية أو المرادفات مع واجهة سهلة الاستخدام.

---

## 🛠️ Stack technique

| Technologie | Rôle |
|---|---|
| React + TypeScript | Frontend |
| Vite | Bundler / Build tool |
| TanStack Router | Routing |
| Supabase | Base de données (PostgreSQL cloud) |
| Supabase Edge Functions | Fonctions serverless (synonymes) |
| shadcn/ui | Composants UI |
| Tailwind CSS | Styles |

---

## 🚀 Installation et lancement

### Prérequis

- [Node.js](https://nodejs.org/) v18 ou supérieur
- npm v9+
- Git

### Étapes

```bash
# 1. Cloner le projet
git clone https://github.com/Ilyessri/maktabat-al-ahadith.git
cd maktabat-al-ahadith

# 2. Copier le fichier d'environnement
cp .env.example .env

# 3. Installer les dépendances
npm install

# 4. Lancer en mode développement
npm run dev
```

L'application sera disponible sur **http://localhost:3000**

> ✅ La base de données est hébergée sur **Supabase (cloud)** — aucune installation locale de base de données n'est nécessaire.

---

## 📁 Structure du projet

```
maktabat-al-ahadith/
├── src/
│   ├── components/       # Composants React réutilisables
│   │   └── ui/           # Composants shadcn/ui
│   ├── hooks/            # Hooks React personnalisés
│   ├── integrations/
│   │   └── supabase/     # Client, types et middleware Supabase
│   ├── lib/              # Utilitaires
│   ├── routes/           # Pages (TanStack Router)
│   └── styles.css        # Styles globaux
├── supabase/
│   ├── functions/        # Edge Functions (recherche synonymes)
│   └── migrations/       # Migrations SQL versionnées
├── scripts/              # Scripts d'import de données
├── .env.example          # Variables d'environnement (modèle)
└── README.md
```

---

## ⚙️ Variables d'environnement

Copier `.env.example` en `.env` et renseigner les valeurs :

```env
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

---

## 👨‍💻 Auteur

**Riani Ilyes** — Projet encadré par **Bsir Bassem**

---

<div align="center">
  <sub>Projet académique — PFA 2025/2026</sub>
</div>