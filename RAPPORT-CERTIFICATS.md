# Rapport — Module Gestion des Certificats
**Date** : 26 juin 2026
**Build** : ✅ ng build --configuration production → SUCCESS (0 erreur, 0 warning)

---

## Architecture du module

```
BACKEND
├── models/Certificate.js              ← Modèle enrichi (downloadedAt, downloadCount, 4 statuts)
├── controllers/certificateController.js ← 10 fonctions CRUD complètes
├── routes/certificateRoutes.js         ← Routes publiques + protégées + admin
└── utils/
    ├── certificateGenerator.js          ← PDF premium PDFKit + QR Code intégré
    └── certificateScheduler.js          ← Auto-envoi 2h après fin d'événement (15 min)

FRONTEND
├── core/
│   ├── services/certificate.service.ts  ← 10 méthodes API complètes
│   └── models/lot2.models.ts            ← CertificateStatus + CertificateVerification enrichis
├── features/certificates/
│   ├── manage-certificates.component.ts ← Panel Admin/Org dans EventDetail
│   ├── my-certificates.component.ts     ← Espace participant (4 statuts)
│   └── verify-certificate.component.ts  ← Vérif publique (URL + saisie manuelle)
└── back-office/pages/
    ├── certificates/bo-certificates.*   ← BO complet (filtres, stats, recherche, CSV)
    └── participants/bo-participants.*   ← Onglet "Par événement" + bouton Générer
```

---

## Fonctionnalités implémentées

### 🔵 Génération de certificat

| Fonctionnalité | Statut |
|---|---|
| Bouton "Générer un certificat" par participant (BoParticipants) | ✅ |
| Génération individuelle via `POST /api/certificates/generate-one` | ✅ |
| Initialisation groupée (tous les confirmés) | ✅ |
| Idempotent (re-générer = retourne l'existant sans erreur) | ✅ |

### 🎨 Design du certificat PDF

| Élément | Statut |
|---|---|
| Nom et prénom du participant | ✅ |
| Titre de l'événement | ✅ |
| Dates début/fin de l'événement | ✅ |
| Lieu de l'événement | ✅ |
| Nom de l'organisateur | ✅ |
| Numéro unique de certificat (UUID) | ✅ |
| Zone signature & cachet (ligne dédiée) | ✅ |
| QR Code vers page de vérification | ✅ |
| Thème sombre élégant (dark navy + indigo) | ✅ |
| Format A4 paysage, coins décoratifs | ✅ |
| Code de vérification abrégé visible | ✅ |

### 📊 Statuts du certificat (4 états)

```
pending → validated → sent → downloaded
```

| Statut | Déclencheur |
|---|---|
| `pending` | Créé manuellement ou par le scheduler |
| `validated` | Admin/Organizer valide manuellement, ou génération individuelle |
| `sent` | PDF envoyé par email (manuel ou automatique) |
| `downloaded` | Premier téléchargement par le participant |

### 📧 Envoi automatique post-événement

- Scheduler lancé au démarrage du serveur (`server.js`)
- Vérification toutes les **15 minutes**
- Traite les événements terminés depuis **moins de 2 heures**
- Crée → Valide → Envoie automatiquement pour chaque participant confirmé
- Gestion d'erreurs individuelle (un échec n'bloque pas les autres)

### 👤 Espace participant

- Page `/my-certificates` : affiche tous les certificats de l'utilisateur connecté
- Téléchargement PDF direct (bouton désactivé si statut `pending`)
- Lien de vérification intégré à chaque carte
- 4 statuts affichés avec icônes et couleurs distinctes

### 🔍 Page de vérification publique

- Route : `/verify-certificate/:code` (accessible sans login)
- **Double entrée** : URL directe (scan QR) OU saisie manuelle du code
- Affiche : titulaire, événement, dates, statut, nombre de téléchargements
- Message d'erreur clair si code invalide

### 🏢 Back-office

**`/backoffice/certificates`** :
- Sélecteur d'événement
- Barre de recherche (nom/email participant)
- Filtre par statut
- 5 cartes statistiques (Total / En attente / Validés / Envoyés / Téléchargés)
- Actions globales : Initialiser / Valider tous / Envoyer tous
- Actions par ligne : Valider / Envoyer / Renvoyer / Télécharger PDF / Vérifier
- Compteur de téléchargements par certificat

**`/backoffice/participants`** — Nouvel onglet "Par événement & Certificats" :
- Sélecteur d'événement
- Liste des participants confirmés avec badge de statut certificat temps réel
- Bouton **"Générer"** / **"Regénérer"** par participant
- Toast de confirmation inline

---

## API Backend

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/certificates/verify/:code` | Public | Vérifier un certificat |
| GET | `/api/certificates/my` | Participant | Mes certificats |
| GET | `/api/certificates/download/:id` | Owner/Admin | Télécharger PDF |
| POST | `/api/certificates/generate-one` | Admin/Org | Générer pour 1 participant |
| POST | `/api/certificates/initialize/:eventId` | Admin/Org | Initialiser tous |
| GET | `/api/certificates/event/:eventId` | Admin/Org | Liste d'un événement |
| GET | `/api/certificates/all` | Admin | Tous les certificats |
| PATCH | `/api/certificates/:id/validate` | Admin/Org | Valider un certificat |
| PATCH | `/api/certificates/bulk-validate/:eventId` | Admin/Org | Valider tous |
| PATCH | `/api/certificates/:id/send` | Admin/Org | Envoyer par email |
| POST | `/api/certificates/bulk-send/:eventId` | Admin/Org | Envoyer tous |

---

## Résultat build

```
main.js     → 767.82 kB (150 kB transféré)
styles.css  → 109.08 kB
Build time  → 17.9 secondes
Erreurs     → 0
Warnings    → 0
```
