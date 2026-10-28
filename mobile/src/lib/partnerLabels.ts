export function partnerTypeLabel(type?: string | null) {
  if (type === "AGENCY") return "Agence";
  if (type === "SERVICE_PROVIDER") return "Prestataire";
  if (type === "INDIVIDUAL") return "Particulier";
  return "Partenaire";
}

export function partnerStatusLabel(status?: string | null) {
  switch (status) {
    case "DRAFT":
      return "Brouillon";
    case "PENDING":
      return "En examen";
    case "APPROVED":
      return "Approuvé";
    case "REJECTED":
      return "Rejeté";
    default:
      return status ?? "—";
  }
}

export function partnerStatusColor(status?: string | null): string {
  switch (status) {
    case "DRAFT":
      return "#6B7A99";
    case "PENDING":
      return "#D97706";
    case "APPROVED":
      return "#1B9E4B";
    case "REJECTED":
      return "#E30613";
    default:
      return "#6B7A99";
  }
}

export function partnerStatusPhrase(
  status?: string | null,
  slaHours = 48,
  hasComplement = false
) {
  if (status === "DRAFT") {
    return "Votre dossier est en brouillon. Complétez-le puis envoyez-le.";
  }
  if (status === "PENDING" && hasComplement) {
    return "Un complément a été demandé. Corrigez votre dossier puis renvoyez-le.";
  }
  if (status === "PENDING") {
    return `Votre dossier est en cours d'examen, réponse sous ${slaHours} h.`;
  }
  if (status === "APPROVED") {
    return "Votre dossier est approuvé. Vous pouvez publier des annonces.";
  }
  if (status === "REJECTED") {
    return "Votre dossier a été rejeté. Vous pouvez le corriger et le renvoyer.";
  }
  return "Suivez l'état de votre demande de partenariat.";
}

export function partnerEventLabel(type: string) {
  switch (type) {
    case "CREATED":
      return "Brouillon créé";
    case "SUBMITTED":
      return "Soumis";
    case "UNDER_REVIEW":
      return "En examen";
    case "COMPLEMENT_REQUESTED":
      return "Complément demandé";
    case "APPROVED":
      return "Approuvé";
    case "REJECTED":
      return "Rejeté";
    case "WITHDRAWN":
      return "Demande retirée";
    default:
      return type;
  }
}
