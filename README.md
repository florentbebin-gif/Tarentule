Tarentule – Application de suivi commercial & managérial

Tarentule est une application interne permettant :

aux conseillers : de remplir leur rapport de performance

aux managers : de consulter les résultats d’équipe et d’accéder aux rapports détaillés

à l’administrateur : de gérer les accès et toutes les données

🚀 Stack technique
Composant	Technologie
Frontend	React (Vite)
Hébergement	Vercel
Authentification	Supabase Auth
Base de données	Supabase PostgreSQL
Sécurité	Row Level Security (RLS) Supabase
Backend Serverless	Supabase Edge Functions
Stockage principal	Table reports (JSONB)
Gestion des utilisateurs	Table profiles (liée à auth.users)
📦 Installation
1. Cloner le projet
git clone https://github.com/tonrepo/tarentule.git
cd tarentule

2. Installer les dépendances
npm install

3. Configurer les variables d’environnement

Créer un fichier .env.local :

VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key


Ne jamais mettre la clé service_role dans le front.

🛠 Structure du projet
src/
  App.jsx              → Layout + topbar + navigation
  RapportForm.jsx      → Rapport conseiller
  ManagerReports.jsx   → Tableau manager
  Settings.jsx         → Page profil + commentaires
  RadarChart.jsx       → Graphiques radars
  PerformanceChart.jsx → Graphique performance globale
  supabase.js          → Client Supabase
  styles.css           → Styles globaux

🔐 Sécurité & Rôles
Rôles définis dans profiles.role

conseiller

manager

admin

Politique RLS (résumé)
Table reports

conseiller : CRUD uniquement sur user_id = auth.uid()

manager : SELECT et UPDATE sur tous les rapports

admin : accès complet

Table profiles

lecture : manager / admin

modification : admin uniquement

💾 Fonctionnement de la sauvegarde

Sauvegarde automatique à chaque sortie de champ (évènement onBlur)

Données stockées en JSON dans reports.data

Calculs Graphiques / Moyennes / % côté front

📨 Envoi d’emails admin

Via Supabase Edge Function :

/functions/send-admin-email


Utilisée depuis la page Settings pour les demandes d'assistance interne.

🧪 Tests & Débogage

Pour activer les logs Supabase :

Console → Project Settings → Logs → API / Edge functions

Tester les policies RLS :

set role postgres;
select * from reports;

📌 Roadmap

Export PDF

Historique des versions d’un rapport

Notifications email automatiques

Mode mobile amélioré

📄 Licence

Usage interne uniquement – non destiné à un usage commercial externe.
