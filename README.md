Tarentule – Application de suivi commercial & managérial

Tarentule est une application interne permettant :

aux conseillers : de remplir leur rapport de performance et de préparer leur entretien avec le manager

aux managers : de consulter les résultats d’équipe, d’accéder aux rapports détaillés et de préparer son entretien avec le conseiller

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

📦 Variables d’environnement

VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key


🛠 Structure du projet
public/
  login-bg.jpg
src/
  components/
    RadarChart.jsx
    PerformanceChart.jsx
  pages/
    ForgotPassword.css
    ForgotPassword.jsx
    Login.css
    Login.jsx
    RapportForm.jsx
    ManagerReports.jsx
    Settings.jsx
    Signup.jsx
  App.jsx
  main.jsx
  supabase.js
  styles.css
.gitignore
index.html
package.json
vercel.json
.env.example

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


Blocage création de compte sur login (compte déjà créé) + bouton création de compte pour le manager et l'admin (sans envoi d'email de validation à l'utilisateur), il fera mot de passe oublié.

Email settings admin fonctionne mais n'arrive pas


Mode mobile amélioré

📄 Licence

Usage interne uniquement – non destiné à un usage commercial externe.
