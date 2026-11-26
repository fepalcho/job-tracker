# language: fr
@JOB-4
Fonctionnalité: Créer une candidature

  Contexte:
    Étant donné que je suis connecté

  Scénario: Création avec les champs obligatoires
    Quand je crée une candidature pour l'entreprise "Capgemini" au poste "Développeur fullstack"
    Alors la candidature "Capgemini" apparaît dans ma liste
    Et son statut est "À contacter"

  Scénario: Entreprise ou poste manquant
    Quand je valide le formulaire sans renseigner l'entreprise
    Alors je vois le message "L'entreprise et le poste sont obligatoires (2 caractères minimum)."
    Et aucune candidature n'est ajoutée

  Scénario: Statut "Envoyée" sans date d'envoi
    Quand je crée une candidature "Sopra Steria" au statut "Envoyée" sans date d'envoi
    Alors je vois le message "La date d'envoi est obligatoire"

  Scénario: L'API refuse un appel sans jeton
    Quand j'appelle "POST /api/applications" sans jeton
    Alors la réponse a le code 401
