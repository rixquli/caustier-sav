# Projet SAV

Admin crée un client et lui fournit un mot de passe temporaire (à changer à la première connexion).
Client se connecte, crée une demande SAV et suit son dossier.

## Authentification 

- gérée par Nextjs (email + mot de passe)
- admin crée le compte client avec un mot de passe temporaire
- client doit changer son mot de passe à la première connexion
- client peut changer son mot de passe depuis son profil
- admin peut réinitialiser le mot de passe d'un client à tout moment

---

## Interfaces

### Page Login

- simple form avec email + password
- premiere conexion => demande nouveau mdp

### Interface client

- sidebar:
  - tableau de bord
  - suport
    - Tickets (liste des demandes actives + archivé + bouton nouvelle demande)
    - FAQ
  - gestion
    - mes equipements

- page d'accueil simple : demandes actives + historique

- profil utilisateur (infos perso (editable) + machines associées en lecture + changement de mot de passe)

- page mes equipement
  - liste des equipement du client en readonly

- bouton pour créer une demande (titre, description, type, priorité, machine)

- page de suivi d'une demande :
  - titre, description, statut, ...
  - messages des admins (avec possibilité de répondre)

- accès à la FAQ avec filtres et recherche (questions/réponses fréquentes)

- barre de recherche qui permet de trouvé une FAQ rapidement

### Interface admin

- sidebar:
  - tableau de bord
  - suport
    - Tickets (liste des demandes + bouton nouvelle demande)
    - FAQ
  - gestion
    - client
    - equipements

- tableau de bord
  - stats
    - tikets ouvert
    - ticket non assigné
    - nb client
  - requete par statut
  - requete par type

- liste des demandes
  - tableau avec filtres (statut, type, priorité, client) et recherche
  - bouton ajout manuel d'une demande
  - page de détail d'une demande, tout éditable + ajout de réponse/note :
    - client (lien vers sa fiche)
    - titre, description, type, priorité
    - statut (modifiable manuellement)
    - assigné à (sélection d'un admin ou non assignée)
    - machine associée au probleme (ajout/suppression)
    - notes internes (visibles admin uniquement, jamais montrées au client)  
    - réponse au client (visible côté client, format sms)

- liste des clients
  - tableau avec filtres et recherche
  - page de détail d'un client, tout éditable, client archivable :
    - nom
    - prénom
    - email
    - téléphone
    - adresse
    - mot de passe
    - machines associées (ajout/suppression)

- page equipement
  - liste des equipements (editable/supprimable)
    - prorpietaire machine, statut, modele, date mise en service
  - pas de bouton de rajout

- gestion de la FAQ
  - tableau avec filtres (catégorie), tri et recherche

---

## Format Data

### Demande SAV

pour la creation:

- titre
- description
- type: SAV/IA/QUESTION/AUTRE
- priorité: Faible, Normale, Haute, Critique
- machine associée (optionnel, recherche dans la liste des machines du client, si non vide, sinon mettre non renseigné)

informations en plus pour le suivi:

- statut : Nouvelle / En cours / En attente client / Résolue / Fermée
- assigné à : sélection d'un admin responsable de la demande (optionnel)
- historique des messages (visible côté client et côté admin, format sms)
- notes internes (visibles admin uniquement, jamais montrées au client)
- journal d'activité (qui a fait quoi, à quelle date/heure) :
  - création de la demande
  - changement de statut
  - modification des champs (titre, description, type, priorité, machine associée)
  - ajout de message/réponse
  - ajout/modification de notes internes
  - affichage pour admin et client (client voit uniquement les actions publiques : statut, messages)
- date création
- date dernière activité
- date résolution
- date fermeture
- lu/non lu

### Machines

machine(s) associée(s) à un client (éditable + supprimable)

pour la creation:

- nom
- marque  
- model
- produits calibrés
- version logiciel
- date de mise en service
- pilote de ligne
- technicien en charge
- nombre de lignes
- serveurs / PC de vision associés (liste)
- statut (en panne, en maintenance, en service)
- notes internes (visibles admin uniquement, jamais montrées au client)

### FAQ

Liste des questions fréquentes gérée par les admins :

- chaque entrée FAQ contient :
  - question (libellé)
  - réponse (contenu détaillé)
  - catégorie (optionnel, pour organisation)
  - date de création et modification
  
Fonctionnalités :

- les admins peuvent créer, modifier, éditer et supprimer des entrées FAQ
- accessible depuis l'interface client avec filtres (catégorie) et recherche par mots-clés
- accessible depuis l'interface admin avec filtres, tri et recherche pour maintenir la base de connaissances

---

## Pour aller plus loin - Intelligence Artificielle

### Assistance IA dans le chat de demande

L'IA peut assister les admins et clients dans les conversations de demande SAV :

- **Suggestion automatique de réponses FAQ** : lors de la réception d'une demande ou d'une réponse client, l'IA analyse le message et suggère une entrée FAQ pertinente qui pourrait répondre à la question, directement dans le chat
- **Approche basée sur la FAQ existante** : l'IA se repose principalement sur la base FAQ existante pour proposer des correspondances et des solutions, garantissant la cohérence et la qualité des réponses

### Notifications

- notification de la création d'une nouvelle demande (admin)
- notification de réception d'une réponse client à une demande (admin)
- notification de réception d'une réponse admin à une demande (client)
