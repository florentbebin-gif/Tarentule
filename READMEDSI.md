✅ 1. NOTE À DESTINATION DU DSI / DPO 
________________________________________
Objet : Présentation de l’outil – Synthèse technique, usage et aspects sécurité / RGPD
Dans le cadre de l’amélioration du suivi managérial et de la performance commerciale, j’ai développé un outil nommé Tarentule, permettant :
•	La saisie par les conseillers de leur rapport (objectifs, réalisés, notes).
•	La visualisation par les managers des synthèses d’équipe, classements, et rapports individuels.
•	La possibilité pour les managers d’apporter une appréciation et des axes d’amélioration dans les rapports des conseillers.
•	Le suivi des dates de dernière mise à jour.
•	Une analyse via tableaux et graphiques.
L’outil a été conçu pour un usage interne uniquement, sans données externes ni diffusion publique.
________________________________________
1. Architecture & Technologies
L’application repose sur trois services modernes, largement utilisés dans l’industrie :
Frontend (interface utilisateur)
•	React hébergé sur Vercel (datacenters européens disponibles)
•	Authentification via Supabase
•	Aucune logique métier sensible n’est stockée dans le front
Backend / Base de données
•	Supabase (PostgreSQL) – Région : Europe (Paris)
•	Stockage :
o	profils utilisateurs
o	rapports mensuels (JSON structuré)
o	rôles : conseiller / manager / admin
Fonctions serveur
•	Supabase Edge Functions
o	utilisées pour envoyer des emails d’alerte à l’administrateur
________________________________________
2. Données traitées
L’outil traite les données suivantes :
Données d’identification
•	nom, prénom
•	adresse email professionnelle
•	agence d’affectation
•	rôle (conseiller / manager / admin)
Données professionnelles
•	objectifs, réalisés, potentiels
•	notes (autoévaluation et manager)
•	date de dernière sauvegarde
Ces données relèvent du domaine “évaluation professionnelle”, couvert par l’article 6 du RGPD (intérêt légitime de l’entreprise).
________________________________________
3. Sécurité & Protection des données
Authentification
•	Auth Supabase (email + mot de passe)
•	Jetons JWT expirant régulièrement
•	Protection contre accès non authentifiés
Contrôles d’accès (RLS – Row Level Security)
Des règles de sécurité strictes ont été mises en place :
•	Conseillers
o	Peuvent lire et modifier uniquement leur propre rapport
o	Ne peuvent pas accéder aux données d’autres conseillers
•	Managers
o	Peuvent consulter et modifier les rapports de toutes les agences
o	Ne peuvent pas modifier les rôles
•	Admin
o	Peut consulter et modifier tous les rapports
o	Peut gérer les rôles et agences
Sauvegarde & Intégrité
•	Données stockées dans PostgreSQL avec réplication Supabase
•	Historisation implicite via dates d’écriture
•	Possibilité d’export CSV sur demande
Protection des secrets
•	Les clés sensibles (service_role) sont stockées uniquement en variable d’environnement dans Supabase et Vercel
•	Aucun secret n’est stocké dans le code ou GitHub
________________________________________
4. Conformité & Recommandations
L’utilisation interne de l’outil repose sur le cadre juridique suivant :
•	Base légale : intérêt légitime (évaluation des performances / pilotage managérial)
•	Aucune donnée sensible au sens “article 9” du RGPD
•	Pas de transfert volontaire hors UE
Points à valider / décider :
1.	Validation DSI / DPO pour déploiement interne
2.	Définition d’une politique de conservation des données
3.	(Optionnel) Passage à un plan Supabase payant pour :
o	SLA garanti
o	logs avancés
o	sauvegardes automatiques gérées
________________________________________
Conclusion
Tarentule est une application interne moderne, structurée et sécurisée, conçue pour améliorer la lisibilité et la cohérence du suivi commercial. Le système respecte les bonnes pratiques d’authentification, d’isolation des données (RLS) et de stockage sécurisé.


