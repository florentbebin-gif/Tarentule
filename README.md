Tarentule – Application de suivi commercial & managérial

Tarentule est une application interne de suivi de la performance commerciale et qualitative.

Elle permet :

aux conseillers

de renseigner leur rapport annuel (résultats, partenariats, technique, bien-être),

de visualiser leur positionnement via des graphiques radar,

de préparer leurs entretiens annuels.

aux managers

de consulter les rapports des conseillers,

d’accéder à un Board Manager avec indicateurs globaux,

de comparer objectifs, réalisés, potentiels et positionnements CGP,

de gérer les utilisateurs (création conseillers).

aux administrateurs

de gérer les accès et les données globales.

🚀 Stack technique
Composant	Technologie
Frontend	React (Vite)
Hébergement	Vercel
Authentification	Supabase Auth
Base de données	Supabase PostgreSQL
Sécurité	Row Level Security (RLS)
Backend serverless	Supabase Edge Functions (non utilisées actuellement)
Stockage principal	Table reports (JSONB)
Profils utilisateurs	Table profiles (liée à auth.users)
📦 Variables d’environnement
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

🛠 Structure du projet
public/
  login-bg.jpg

src/
  components/
    RadarChart.jsx
    PerformanceChart.jsx (encore présent mais non utilisé)
  pages/
    Login.jsx
    Signup.jsx
    ForgotPassword.jsx
    RapportForm.jsx        # Rapport Conseiller
    ManagerReports.jsx    # Board & Synthèse Manager
    Settings.jsx           # Paramètres utilisateur
  App.jsx
  main.jsx
  supabase.js
  styles.css

.env.example
index.html
package.json
vercel.json

👤 Gestion des rôles

Les rôles sont définis dans profiles.role :

conseiller

manager

admin

Droits fonctionnels
Rôle	Droits
conseiller	Accès exclusif à son rapport
manager	Accès aux rapports conseillers + Board Manager
admin	Accès global (équivalent manager + administration)
🔐 Sécurité (Row Level Security)
Table reports

conseiller

CRUD uniquement sur user_id = auth.uid()

manager

SELECT + UPDATE sur tous les rapports

admin

Accès complet

Table profiles

SELECT : utilisateurs authentifiés

UPDATE :

utilisateur sur son propre profil

manager/admin selon besoin métier

⚠️ Les policies ont été volontairement simplifiées pour stabilité et lisibilité.

💾 Sauvegarde des données

Sauvegarde automatique

Déclenchée à chaque sortie de champ (onBlur)

Données stockées en JSON dans reports.data

Calculs des moyennes, totaux et pourcentages réalisés côté front

📊 Graphiques & analyses
Rapport Conseiller

Radars par thématique :

Résultats

Partenariats

Technique

Bien-être

Board Conseiller avec :

% d’atteinte global

Réalisé + Potentiel vs Objectifs

Positionnement CGP (base 100)

Graphique thématique dynamique

Sélecteur d’année (2024 / 2025)

ManagerReports

Board Manager :

Synthèse multi-conseillers

Filtres agences

Bouton Collecte All

Graphiques dynamiques par thématique

Tableau Synthèse Manager :

Moyennes CGP / Manager

Colonnes spécialisées (Technique, Bien-être, Social…)

Sélecteur d’année global (2024 / 2025)

📅 Gestion multi-années

L’application fonctionne sur plusieurs exercices (2024 / 2025).

Chaque année possède son propre rapport.

Au changement d’année :

les données affichées s’actualisent automatiquement,

les sauvegardes sont isolées par exercice.

➕ Gestion des utilisateurs
Page dédiée (manager / admin)

Ajout d’utilisateurs conseillers uniquement

Champs obligatoires :

Prénom

Nom

Email

Bureau

Poste (CGP / CPSocial)

Pas d’email de validation

L’utilisateur utilise “Mot de passe oublié” pour définir son mot de passe

🛑 Fonctionnalités supprimées volontairement

❌ Envoi d’email via Supabase Edge Function

❌ Box “Contacter l’administrateur” dans Paramètres

✅ Message fixe à la place :

« Pour modifier des informations personnelles (agence, statut, etc.), vous pouvez contacter votre manager. »

🧪 Debug & tests
Logs Supabase

Dashboard → Logs → API / Edge Functions

Tests RLS
set role postgres;
select * from reports;

📌 Roadmap (à jour)

✅ Gestion avancée des utilisateurs (manager/admin)

✅ Multi-exercices (2024 / 2025)

✅ Board Manager & Board Conseiller

⏳ Amélioration UX mobile

⏳ Nettoyage composants inutilisés (PerformanceChart)

⏳ Optimisation performances graphiques

📄 Licence

Usage interne uniquement –
non destiné à un usage commercial externe.

Si tu veux, au prochain message je peux :

te fournir une version diff Git (avant / après),

ou un README simplifié pour onboarding utilisateur (conseiller / manager).
