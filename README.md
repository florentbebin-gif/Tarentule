# Tarentule – Application de suivi commercial & managérial

Tarentule est une application interne dédiée au pilotage de la performance commerciale et qualitative des conseillers, ainsi qu’au suivi managérial.

L’outil est strictement réservé à un usage interne à l’entreprise.

---

## 🎯 Objectifs fonctionnels

### Pour les conseillers
- Renseigner leur rapport annuel :
  - résultats,
  - partenariats,
  - technique,
  - bien-être, social.
- Visualiser leur positionnement via des graphiques radar.
- Préparer leurs entretiens annuels.
- Suivre l’atteinte de leurs objectifs (réalisé / potentiel).

### Pour les managers
- Consulter les rapports des conseillers.
- Accéder à un **Board Manager** :
  - indicateurs globaux,
  - graphiques dynamiques,
  - filtres par agences.
- Comparer objectifs, réalisés, potentiels et positionnements CGP.
- Ajouter des appréciations managériales.
- Gérer les utilisateurs (création de conseillers).

### Pour les administrateurs
- Accès global équivalent manager.
- Supervision des profils et des données.

---

## 🚀 Stack technique

| Composant | Technologie |
|---------|------------|
| Frontend | React (Vite) |
| Hébergement | Vercel |
| Authentification | Supabase Auth |
| Base de données | Supabase PostgreSQL |
| Sécurité | Row Level Security (RLS) |
| Backend serverless | Supabase Edge Functions (non utilisées) |

---

## 📰 Fil d’actualité (BOFiP / BOSS)

Un fil d’actualité dynamique est alimenté via deux flux RSS officiels (BOFiP et BOSS) stockés en base dans `news_items` pour être affichés dans le Home.

### Variables d’environnement (Vercel)

Ajouter les variables suivantes dans les environnements Vercel :

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEWS_REFRESH_TOKEN`

> ⚠️ La clé `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais être exposée côté client.

### Cron Vercel recommandé

Créer un Cron Job Vercel (ou équivalent) qui appelle :

- **URL** : `POST https://<domain>/api/news/refresh`
- **Header** : `Authorization: Bearer <NEWS_REFRESH_TOKEN>`
- **Fréquence** : toutes les heures (ou 1 fois/jour selon besoin)

---


## 🗄️ Modèle de données

### Tables principales
- **reports**
  - Données des rapports (JSONB),
  - Isolées par utilisateur et par année (exercice).
- **profiles**
  - Informations utilisateurs,
  - Rôle applicatif,
  - Agence / bureau,
  - Poste occupé (CGP / CPSocial).

---

## 👤 Gestion des rôles

Les rôles sont définis dans `profiles.role` :

- `conseiller`
- `manager`
- `admin`

### Droits fonctionnels

| Rôle | Droits |
|----|-------|
| conseiller | Accès exclusif à son rapport |
| manager | Accès aux rapports conseillers + Board Manager |
| admin | Accès global (équivalent manager + administration) |

---

## 🔐 Sécurité (Row Level Security)

### Table `reports`
- **Conseiller**
  - CRUD uniquement sur ses propres données (`user_id = auth.uid()`).
- **Manager**
  - SELECT + UPDATE sur l’ensemble des rapports.
- **Admin**
  - Accès complet.

### Table `profiles`
- Lecture autorisée pour les utilisateurs authentifiés.
- Modification :
  - utilisateur sur son propre profil,
  - manager/admin selon besoins métier.

✅ Les règles RLS garantissent l’isolement des données même en cas de compromission du frontend.

---

## 📅 Gestion multi-années

L’application fonctionne par exercice (ex. **2024 / 2025**).

- Chaque année possède son propre rapport.
- Le changement d’année :
  - met à jour automatiquement l’affichage,
  - isole les sauvegardes.
- Possibilité de « vider le rapport » lors d’un nouvel exercice.

---

## 📊 Graphiques & analyses

### Rapport Conseiller
- Radars par thématique :
  - Résultats,
  - Partenariats,
  - Technique,
  - Bien-être,
  - Social.
- **Board Conseiller** :
  - % d’atteinte global,
  - Réalisé + Potentiel vs Objectifs,
  - Positionnement CGP (base 100),
  - Graphique thématique dynamique.
- Sélecteur d’année (2024 / 2025).

### ManagerReports
- **Board Manager** :
  - Synthèse multi-conseillers,
  - Filtres par agences,
  - Bouton Collecte All,
  - Graphiques dynamiques par thématique.
- Tableau Synthèse Manager :
  - Moyennes CGP / Manager,
  - Colonnes spécialisées (Technique, Bien-être, Social…),
  - Sélecteur d’année global.

---

## ➕ Gestion des utilisateurs

Page dédiée (manager / admin uniquement) :

- Création de **conseillers uniquement**.
- Champs obligatoires :
  - Prénom,
  - Nom,
  - Email professionnel,
  - Bureau,
  - Poste (CGP / CPSocial).
- Pas d’email de validation.
- L’utilisateur définit son mot de passe via **“Mot de passe oublié”**.

### Restriction des emails
- Création autorisée uniquement pour les adresses se terminant par :
@laplace-groupe.com

yaml
Copier le code
- Les inscriptions publiques sont désactivées côté Supabase.

---

## 🛑 Fonctionnalités volontairement supprimées

- ❌ Envoi d’email via Supabase Edge Functions.
- ❌ Box « Contacter l’administrateur » dans Paramètres.

✅ Message fixe affiché à la place :
> « Pour modifier des informations personnelles (agence, statut, etc.), vous pouvez contacter votre manager. »

---

## 🧪 Debug & exploitation

- Logs Supabase : Dashboard → Logs → API
- Tests RLS possibles directement en SQL.
- Calculs (totaux, moyennes, pourcentages) réalisés côté frontend.

---

## 📌 Roadmap

✅ Board Manager & Board Conseiller  
✅ Multi-exercices (2024 / 2025)  
✅ Gestion avancée des utilisateurs  

⏳ Optimisation UX mobile  
⏳ Nettoyage composants legacy  
⏳ Optimisation performances graphiques  

---

## 📄 Licence

Usage strictement interne —  
non destiné à un usage commercial externe.
