✅ NOTE À DESTINATION DU DSI / DPO

Objet : Présentation de l’outil Tarentule – architecture, usages et conformité sécurité / RGPD

Contexte & objectifs

Dans le cadre de l’amélioration du suivi managérial et de la performance commerciale, un outil interne nommé Tarentule a été développé.

Il permet :

la saisie par les conseillers de leur rapport annuel (objectifs, réalisés, autoévaluations),

la consultation par les managers de synthèses d’équipe, tableaux comparatifs et rapports individuels,

la possibilité pour les managers d’apporter des appréciations qualitatives et des axes d’amélioration,

le suivi des mises à jour et de la complétude des rapports,

une analyse visuelle via tableaux et graphiques (radars, indicateurs).

L’outil est strictement réservé à un usage interne, sans accès public, sans interconnexion avec des services tiers non maîtrisés, et sans diffusion de données en externe.

1. Architecture & technologies

Tarentule repose sur une architecture moderne, largement éprouvée dans l’écosystème web professionnel.

Frontend (Interface utilisateur)

Application React (framework JavaScript)

Hébergement sur Vercel (datacenters européens disponibles)

Accès uniquement via authentification

Aucune donnée sensible ni logique métier critique stockée côté client

Backend & base de données

Supabase (PostgreSQL managé)

Région d’hébergement : Union Européenne (Paris)

Stockage des données :

profils utilisateurs (identité professionnelle, rôle),

rapports annuels des conseillers (données structurées au format JSON),

métadonnées de suivi (dates de modification).

Fonctions serveur

Des Supabase Edge Functions ont été prévues conceptuellement,

Aucune fonction serveur active d’envoi d’email ou d’automatisation n’est actuellement utilisée,

Toute logique critique est contenue dans les règles de sécurité de la base (RLS).

2. Données traitées

L’outil traite exclusivement des données professionnelles.

Données d’identification

Nom

Prénom

Adresse email professionnelle

Agence / bureau de rattachement

Rôle applicatif (conseiller / manager / administrateur)

Poste occupé (ex. CGP, CPSocial)

Données professionnelles

Objectifs commerciaux

Réalisés et potentiels estimés

Notes d’autoévaluation (CGP)

Notes et appréciations managériales

Dates de dernière mise à jour

👉 Ces données relèvent de l’évaluation professionnelle et du pilotage managérial, entrant dans le cadre de l’article 6.1.f du RGPD (intérêt légitime de l’entreprise).

3. Sécurité & protection des données
Authentification

Authentification Supabase (email + mot de passe)

Gestion de sessions via JWT avec expiration

Aucun accès possible sans authentification valide

Contrôles d’accès (Row Level Security – RLS)

Des règles d’isolation strictes sont appliquées directement en base de données :

Conseillers

Accès exclusivement à leurs propres données

Lecture et modification uniquement de leur rapport

Aucun accès aux données d’autres conseillers

Managers

Consultation et modification des rapports des conseillers

Accès aux tableaux de synthèse et indicateurs globaux

Impossibilité de modifier les rôles applicatifs

Administrateurs

Accès complet aux données (rapports, profils)

Gestion des affectations et rôles

👉 Les règles RLS garantissent que même en cas de compromission du frontend, les données restent protégées.

Sauvegarde & intégrité des données

Données stockées dans PostgreSQL avec mécanismes de réplication Supabase

Dates d’écriture permettant une traçabilité des modifications

Possibilité d’export des données (CSV) sur demande managériale ou DSI

Protection des secrets

Les clés sensibles (ex. service_role) sont :

stockées uniquement comme variables d’environnement sécurisées

jamais exposées dans le code source

jamais stockées dans GitHub

Séparation stricte entre clés publiques (anon) et clés privées

4. Conformité RGPD & recommandations
Éléments de conformité

Base légale : intérêt légitime (pilotage managérial et évaluation professionnelle)

Absence de données sensibles au sens de l’article 9 du RGPD

Hébergement des données au sein de l’UE

Pas de transfert volontaire hors Union Européenne

Usage strictement interne (aucun accès client / tiers)

Points à valider ou décider

Validation DSI / DPO pour déploiement et usage interne

Définition d’une politique de conservation des données :

durée de conservation des rapports (ex. N + 3 ans),

modalités d’archivage ou de suppression

(Optionnel) Migration vers un plan Supabase payant afin de bénéficier de :

SLA contractuel,

logs avancés,

sauvegardes automatisées managées.

Conclusion

Tarentule est une application interne moderne, structurée et sécurisée, conçue pour améliorer la lisibilité, la cohérence et la fiabilité du suivi commercial et managérial.

L’architecture respecte les bonnes pratiques en matière :

d’authentification,

d’isolation des données via RLS,

de conformité RGPD,

de sécurisation des secrets.

Aucune remontée de données externes, aucun tracking tiers et aucun usage non maîtrisé ne sont mis en œuvre.
