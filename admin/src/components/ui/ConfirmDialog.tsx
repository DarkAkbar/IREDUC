import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function ConfirmDialog({
  open,
  title,
  description,
  requireReason = false,
  confirmLabel = "Confirmer",
  danger = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  requireReason?: boolean;
  confirmLabel?: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (requireReason && reason.trim().length < 3) {
      setError("Le motif est obligatoire (3 caractères minimum).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      title={title}
      description={description}
      onClose={() => {
        if (!loading) {
          setReason("");
          setError(null);
          onClose();
        }
      }}
      footer={
        <>
          <Button type="button" variant="outline" disabled={loading} onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            variant={danger ? "danger" : "success"}
            disabled={loading}
            onClick={() => void handleConfirm()}
          >
            {loading ? "Traitement…" : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--text-primary)]">
          Motif {requireReason ? "(obligatoire)" : "(optionnel)"}
        </label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Saisir un motif…"
          disabled={loading}
        />
        {error ? (
          <p className="text-sm font-medium text-ireduc-red" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
