# language: fr
@JOB-3
Fonctionnalité: Connexion avec Google

  Scénario: Une page privée redirige vers la connexion
    Étant donné que je ne suis pas connecté
    Quand j'ouvre la page "/applications"
    Alors je suis redirigé vers "/login"

  Scénario: L'API refuse un appel sans jeton
    Quand j'appelle "GET /api/applications" sans jeton
    Alors la réponse a le code 401