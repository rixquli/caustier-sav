# Cahier des Charges

## Application de Gestion du Service Après-Vente (SAV)

| | |
|---|---|
| **Projet** | Plateforme de gestion des requêtes SAV |
| **Version** | 1.0 |
| **Date** | Juin 2026 |
| **Statut** | Brouillon — à valider |

---

## 1. Présentation du projet

### 1.1 Contexte

L'entreprise souhaite se doter d'une application permettant de structurer et de centraliser le traitement des demandes de service après-vente (SAV) émises par ses clients. Aujourd'hui, ce suivi n'est pas formalisé dans un outil dédié ; l'objectif est de mettre en place une plateforme web où :

- l'administrateur crée et gère les comptes clients ;
- chaque client dispose d'un espace personnel pour signaler un problème, suivre son traitement et consulter l'historique de ses échanges ;
- une brique d'assistance automatisée propose des réponses déjà connues pour les demandes récurrentes, afin de réduire la charge du support.

### 1.2 Objectifs du projet

- Offrir un point d'entrée unique et structuré pour les demandes SAV des clients.
- Permettre à l'administrateur de suivre, prioriser et traiter l'ensemble des requêtes.
- Réduire le temps de traitement des demandes récurrentes grâce à une détection automatique des réponses déjà existantes.
- Capitaliser sur l'historique des requêtes pour constituer une base de connaissance (FAQ).

### 1.3 Périmètre du projet

**Inclus dans le périmètre :**
- Gestion des comptes clients par l'administrateur (pas d'auto-inscription).
- Création et suivi de requêtes SAV par les clients.
- Suivi et traitement des requêtes par l'administrateur.
- Suggestion automatique de réponses pour les requêtes déjà connues.
- FAQ consultable par les clients.

---

## 2. Acteurs du système

| Acteur | Rôle |
|---|---|
| **Administrateur** | Crée et gère les comptes clients, suit et traite l'ensemble des requêtes, alimente la base de connaissance (FAQ). |
| **Client** | Se connecte avec les identifiants fournis, crée des requêtes SAV, suit leur traitement, consulte son historique et la FAQ. |
| **Module IA** | Composant logiciel (non humain) qui analyse les requêtes entrantes et propose des réponses existantes lorsqu'une correspondance est détectée. |

---

## 3. Spécifications fonctionnelles

### 3.1 Authentification et gestion des comptes

- Aucune auto-inscription : seul l'administrateur crée les comptes clients.
- L'administrateur définit un identifiant et un mot de passe initial pour chaque client.
- Le client se connecte via un formulaire (identifiant/email + mot de passe).
- *Point à valider :* canal de transmission des identifiants au client (email automatique, remise manuelle, etc.).
- Il est recommandé que le client puisse modifier son mot de passe après la première connexion, et que l'administrateur puisse le réinitialiser en cas d'oubli.

### 3.2 Interface Client

**3.2.1 Tableau de bord**
- Vue synthétique des requêtes en cours (statut, priorité, date de dernière mise à jour).
- Indicateurs simples : nombre de requêtes ouvertes / en cours / résolues.
- Accès rapide à la création d'une requête et à la FAQ.

**3.2.2 Profil**
- Consultation et modification des informations personnelles (nom, email, coordonnées).
- Liste des machines/équipements associés au compte.
- Modification du mot de passe.

**3.2.3 Historique des requêtes**
- Liste de toutes les requêtes (passées et en cours) avec filtres par statut, type, priorité, machine ou date.
- Détail d'une requête : description complète, échanges avec le support, statut, réponse apportée.

**3.2.4 Création d'une requête**

Le formulaire de création comporte les champs suivants :

| Champ | Description |
|---|---|
| Titre | Texte court, obligatoire |
| Description | Texte libre, obligatoire |
| Type | Liste déroulante (ex. panne, maintenance, question technique, réclamation, pièce détachée — *liste à valider avec le métier*) |
| Priorité | Faible / Moyenne / Haute / Urgente |
| Machine | Sélection parmi les machines associées au client |

Lors de la soumission, le module IA analyse la requête et propose, le cas échéant, une réponse immédiate (voir section 3.4).

**3.2.5 Questions récurrentes (FAQ)**
- Liste de questions/réponses consultable par catégorie ou recherche par mot-clé.
- Alimentée par l'administrateur et enrichie progressivement à partir des requêtes résolues les plus fréquentes.

### 3.3 Interface Administrateur

**3.3.1 Gestion des clients**
- Création, modification et suppression de comptes clients.
- Génération des identifiants/mots de passe.
- Association des machines/équipements à un client.

**3.3.2 Suivi et traitement des requêtes**
- Vue d'ensemble de toutes les requêtes, tous clients confondus, avec filtres et tri (statut, priorité, type, client, date).
- Reprise de la même logique de suivi que côté client, adaptée à une vue globale (conformément au besoin exprimé : « reprendre l'interface suivi client »).
- Changement de statut d'une requête (ex. Nouvelle → En cours → En attente client → Résolue → Fermée).
- Rédaction d'une réponse libre, ou validation/édition d'une réponse suggérée automatiquement par le module IA.

**3.3.3 Tableau de bord administrateur**
- Indicateurs : nombre de requêtes par statut et par priorité, délai moyen de traitement.
- Mise en avant des requêtes urgentes ou en attente depuis longtemps.

**3.3.4 Gestion de la base de connaissance (FAQ)**
- Création, modification et suppression des questions/réponses fréquentes.
- Ajout à la FAQ des réponses suggérées par le module IA jugées pertinentes.

### 3.4 Traitement automatisé minimal (IA)

- **Objectif :** détecter qu'une requête entrante correspond, totalement ou partiellement, à une question déjà traitée (FAQ ou requêtes résolues), et proposer la réponse associée au client.
- **Fonctionnement envisagé :**
  1. Analyse du titre et de la description de la nouvelle requête.
  2. Comparaison avec la base de connaissance (recherche par mots-clés et/ou similarité textuelle).
  3. Si une correspondance suffisante est trouvée, proposition automatique de la réponse au client.
- Le client indique si la réponse proposée résout son problème (clôture possible de la requête) ou s'il souhaite qu'elle soit transmise à un agent humain.
- Le niveau attendu est volontairement minimal : une recherche par mots-clés ou par similarité textuelle simple suffit pour une première version, sans nécessiter de modèle de langage complexe. Une évolution vers une solution plus avancée pourra être envisagée ultérieurement.

---

## 4. Modèle de données (proposition)

| Entité | Attributs principaux |
|---|---|
| **Utilisateur** | id, nom, prénom, email, mot de passe (haché), rôle (Admin / Client), date de création |
| **Machine** | id, référence, modèle, numéro de série, client (clé étrangère) |
| **Requête** | id, titre, description, type, priorité, statut, client (FK), machine (FK), date de création, date de mise à jour |
| **Échange/Réponse** | id, requête (FK), auteur (Client / Admin / IA), contenu, date |
| **FAQ** | id, question / mots-clés, réponse, catégorie |

Ce modèle est une proposition de base, à affiner lors de la phase de conception détaillée.

---

## 5. Spécifications techniques

| Composant | Choix retenu | Remarques |
|---|---|---|
| Framework applicatif | Blazor | *À préciser : Blazor Server ou Blazor WebAssembly — ce choix impacte l'hébergement et le fonctionnement hors-ligne* |
| Présentation | CSS | *À préciser : CSS pur ou framework (Bootstrap, etc.)* |
| Base de données | SQLite | Solution légère, adaptée à un volume modéré ; prévoir une migration vers une base plus robuste si le volume de clients/requêtes augmente significativement |
| Authentification | Par session, contrôle d'accès par rôle | Mot de passe stocké haché (jamais en clair) |

---

## 6. Exigences non fonctionnelles

- **Sécurité :** mots de passe hachés, contrôle d'accès strict par rôle (un client ne doit accéder qu'à ses propres requêtes et machines), protection contre les injections SQL et les failles XSS.
- **Ergonomie :** interface simple et claire, accessible à des utilisateurs non techniques côté client.
- **Performance :** temps de réponse raisonnable pour la consultation des tableaux de bord et de l'historique.
- **Compatibilité :** fonctionnement sur les navigateurs courants (Chrome, Firefox, Edge).
- **Disponibilité :** accessible aux horaires d'utilisation prévus (modalités d'hébergement à définir).

---

## 7. Livrables attendus

- Application web fonctionnelle (Blazor) intégrant les interfaces client et administrateur.
- Base de données SQLite avec scripts de création/migration.
- Documentation technique (architecture, modèle de données).
- Documentation utilisateur (guide client, guide administrateur).
- Code source commenté.
