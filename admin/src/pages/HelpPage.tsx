import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";

export function HelpPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Aide"
        description="Raccourcis et bonnes pratiques pour l'équipe IREDUC."
      />
      <Card>
        <CardHeader>
          <CardTitle>Modération</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--text-muted)]">
          <p>Traitez d&apos;abord la file d&apos;attente depuis le tableau de bord.</p>
          <p>Les signalements ouverts apparaissent dans Signalements et la cloche admin.</p>
          <p>Toute suspension doit inclure un motif journalisé.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Raccourcis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <kbd className="rounded border px-1">Ctrl+K</kbd> — recherche globale
          </p>
          <p>Export CSV — listes Utilisateurs, Partenaires, Demandes (menu Outils).</p>
        </CardContent>
      </Card>
    </div>
  );
}
