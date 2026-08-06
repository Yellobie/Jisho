# Jisho — carnet de vocabulaire japonais

Application web installable (PWA) pour apprendre et réviser du vocabulaire japonais.
Fonctionne hors ligne, synchronise via Google Drive.

**Adresse :** https://yellobie.github.io/Jisho/

---

## Mise en ligne

Envoie le contenu de ce dossier à la racine du dépôt `Jisho` :

```
index.html
manifest.json
sw.js
icons/       (3 fichiers)
fonts/       (6 fichiers)
```

Sur GitHub : **Add file → Upload files**, glisse-dépose les fichiers et les
deux dossiers, puis **Commit changes**. La mise en ligne prend une minute.

## Installation sur le téléphone

1. Ouvre https://yellobie.github.io/Jisho/ dans **Chrome**
2. Menu ⋮ → **Installer l'application** (ou « Ajouter à l'écran d'accueil »)
3. L'icône Jisho apparaît sur l'écran d'accueil, l'app s'ouvre en plein écran

Sur PC : même adresse, une icône d'installation apparaît dans la barre d'adresse.

## Première connexion

À l'ouverture, l'app demande de se connecter avec Google.

Google affichera un avertissement **« Google n'a pas validé cette application »** :
c'est normal pour une app en mode Test. Clique **Paramètres avancés** puis
**Accéder à Jisho (non sécurisé)**. Cet écran ne concerne que toi, déclaré comme
testeur du projet.

L'app crée alors un dossier **Jisho** à la racine de ton Drive, contenant
`carnet-japonais.json`. C'est ta sauvegarde.

**Déplace ce dossier dans ton dossier « Sauvegarde »** depuis Drive, une seule
fois. L'app le retrouvera ensuite tout seule, où que tu le ranges.

Pourquoi ce déplacement manuel ? L'autorisation demandée est `drive.file` :
l'app ne voit **que les fichiers qu'elle a créés elle-même**, jamais le reste
de ton Drive. C'est ce qui garantit qu'elle ne peut rien lire d'autre — mais
cela signifie aussi que ton dossier « Sauvegarde », créé à la main, lui est
invisible. Elle ne peut donc pas y déposer le dossier directement. En revanche,
une fois le dossier Jisho déplacé, l'autorisation le suit : elle est attachée
à l'identifiant du dossier, pas à son emplacement.

---

## Fonctionnement de la synchronisation

- Chaque ajout, modification ou révision déclenche un envoi vers Drive
  quelques secondes plus tard, sans action de ta part
- Hors ligne, tout est enregistré sur l'appareil ; l'envoi se fait au retour
  de la connexion
- Sur deux appareils, les modifications sont fusionnées automatiquement
- Si le **même mot** a été modifié différemment des deux côtés, un écran te
  demande quelle version garder — c'est le seul cas qui demande un arbitrage
- Les compteurs de révision ne créent jamais de conflit : la valeur la plus
  avancée est conservée

La session reste valable **30 jours** hors ligne avant de redemander une
connexion.

---

## Modifier l'application plus tard

Tout tient dans `index.html`. Tu peux l'éditer directement sur GitHub
(clique le fichier, puis l'icône crayon) — la mise en ligne se refait seule.

Si tu modifies `index.html`, `sw.js` ou les fichiers mis en cache, incrémente
la version du cache en haut de `sw.js` :

```js
var CACHE = "jisho-v2";   // v1 → v2
```

Sans ça, les appareils déjà installés continueront de servir l'ancienne
version depuis leur cache.

---

## Détails techniques

- Aucun serveur : GitHub Pages sert des fichiers statiques, l'authentification
  se fait côté navigateur via Google Identity Services
- Le dépôt ne contient jamais de données personnelles, uniquement le code
- Polices Spectral et Noto Serif JP embarquées : aucun appel réseau pour
  l'affichage, l'app est lisible en mode avion dès la première ouverture
- `localStorage` sert de cache immédiat et de secours hors ligne ; le fichier
  Drive est la source de vérité partagée entre appareils
- Fusion à trois versions (locale / distante / dernière base commune) pour
  éviter d'écraser silencieusement le travail fait sur un autre appareil
- Le Client ID OAuth visible dans le code est un identifiant public, pas un
  secret : il ne donne accès à rien sans le consentement du compte Google
