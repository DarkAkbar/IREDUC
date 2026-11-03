# Changelog

Toutes les modifications notables du projet IREDUC sont documentées dans ce fichier.

## [Non publié]

### Mobile — Refonte écran Services (liste catégorie)

- **En-tête** : `AppHeader` + `HeaderSearchButton` (loupe ronde 44 px) ; recherche déployable animée (« Rechercher un service… », debounce 300 ms) ; titre +2 px, espacements resserrés.
- **Filtres** : bouton « Filtres » fixe en tête de la rangée de catégories (`CategoryFilterRow`) ; suppression de l’ancienne ligne recherche + filtres.
- **Nettoyage** : retrait des sous-catégories (Tous / Installation / Dépannage / Plus) et du sous-titre marketing ; conservation du titre « Services — {catégorie} » et de la ligne résultats / tri.
- **Accord** : `formatResultCount` (« 1 résultat » / « N résultats ») sur les listes Services et Biens.
- **Réutilisation** : gabarit d’en-tête prêt pour les listes de biens (non branché sur ces écrans pour l’instant).
