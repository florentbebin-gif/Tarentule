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

Définir, avant de remplir les champs, un exercice allant du 1/01/.... au 31/12/.... Un bouton de sauvegarde de l'exercice (Archivage de l'exerccie) permettra d'archiver l'exercice et de le réouvrir (on aura jusqu'à 2archives pouvant etre réouverte sans perdre les données (prévoir les boutons). Tout de suite après l'archivage, créer nouvel exercice du 1/01/.... au 31/12/.... avec un rapport vierge (pas plus de 3 exercices pouvant être archivé, le dernier archivage faisant glisser les anciens et supprimant le plus ancien (confimation à demander à l'utilisateur)).
Dans le rapport conseiller, ajouter en ligne 8 (redéfinir la suivante en 9) sur le meme fonctionnement que la ligne 7 : "8 - Primes périodiques : réalisation/détection de PER en VP ou de prévoyance" => Adapter le graphique radar => adapter le rapport Manager (moyenne).


Email settings admin fonctionne mais n'arrive pas

Dans le rapport Manager supprimer la colonne Signature 1 mois
Dans le rapport Manager créer au-dessus de la carte Synthèse Manager une autre carte s’intitulant Board Manager. Il pourra cocher les agences également ici (elles seront liées avec celles du Synthèse Manager). Création de plusieurs graphique :Il y aura plusieurs graphiques :
    1-	total réalisé comparé à l’objectifs total
    2-	Un graphique camembert rappelant le % d’atteinte total (Somme de réalisé en rapport à la somme des Objectifs)
    3-	Un graphique barre empilé (réalisé + signature 1 mois) comparé à l’objectifs total
    4-	Un graphique barre empilé (réalisé + signature 1 mois + potentiel 31/12) comparé à l’objectifs total
    5-	Un graphique histogramme empilé reprenant les Notes CGP sur une base 100
    Ces graphiques doivent s’adapter en fonction des agences sélectionnées.

Mode mobile amélioré

📄 Licence

Usage interne uniquement – non destiné à un usage commercial externe.
