# language: fr
@JOB-8 @securite
Fonctionnalité: Isolation des candidatures entre utilisateurs

  Contexte:
    Étant donné que "alice" possède une candidature "Capgemini"

  Scénario: Un autre utilisateur ne voit pas la candidature
    Quand je me connecte en tant que "bob"
    Alors ma liste de candidatures est vide

  Scénario: Lecture par identifiant refusée
    Étant donné que je suis connecté en tant que "bob"
    Quand j'appelle "GET /api/applications/{id}" avec l'identifiant de la candidature d'alice
    Alors la réponse a le code 404

  Scénario: Modification et suppression refusées
    Étant donné que je suis connecté en tant que "bob"
    Quand j'appelle "PUT" puis "DELETE /api/applications/{id}" sur la candidature d'alice
    Alors la réponse a le code 404
    Et la candidature "Capgemini" d'alice est inchangée
