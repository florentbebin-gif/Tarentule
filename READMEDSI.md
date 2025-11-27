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

L’outil est strictement réservé à un usage interne, sans accès public, sans interconnexion avec des services tiers non maîtrisés et sans diffusion de données en externe.

1. Architecture & technologies
Frontend

Application React

Hébergement Vercel

Accès sécurisé via authentification

Aucune logique critique ni donnée sensible stockée côté client

Backend & base de données

Supabase (PostgreSQL managé)

Hébergement des données en Union Européenne (Paris)

Stockage :

profils utilisateurs (identité professionnelle, rôle, poste),

rapports annuels structurés (JSON),

métadonnées de suivi.

Fonctions serveur

Des Supabase Edge Functions ont été envisagées,

Aucune fonction serveur active d’envoi d’email ou d’automatisation n’est utilisée actuellement,

La sécurité repose principalement sur les règles RLS.

2. Données traitées
Données d’identification

Nom, prénom

Adresse email professionnelle

Agence / bureau

Rôle applicatif (conseiller / manager / admin)

Poste occupé (CGP / CPSocial)

Données professionnelles

Objectifs commerciaux

Réalisés et potentiels

Notes d’autoévaluation (CGP)

Notes et appréciations managériales

Dates de dernière mise à jour

Ces données relèvent de l’évaluation professionnelle, fondée sur l’intérêt légitime de l’entreprise (article 6.1.f du RGPD).

3. Sécurité & protection des données
Authentification

Supabase Auth (email + mot de passe)

Sessions sécurisées par JWT

Accès impossible sans authentification valide

Contrôles d’accès (RLS)

Conseillers : accès exclusif à leurs données

Managers : accès aux rapports des équipes

Administrateurs : accès global

Même en cas de compromission du frontend, l’accès aux données reste limité par la base.

Sauvegarde & intégrité

Données stockées en PostgreSQL avec réplication Supabase

Traçabilité via dates de modification

Possibilité d’export sur demande interne

Protection des secrets

Clés sensibles stockées uniquement en variables d’environnement

Aucun secret exposé dans le code ou GitHub

4. Conformité & recommandations
Éléments de conformité

Usage strictement interne

Hébergement UE

Aucune donnée sensible (article 9 RGPD)

Pas de transfert hors UE

Création de compte restreinte aux emails professionnels

Points à valider

Validation DSI / DPO

Politique de conservation des données

Option de montée en gamme Supabase (SLA, logs, sauvegardes)

Conclusion

Tarentule est une application interne moderne, sécurisée et conforme aux bonnes pratiques, conçue pour améliorer le pilotage managérial et la lisibilité des performances commerciales, dans le respect des exigences RGPD.
