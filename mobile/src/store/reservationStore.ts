import { create } from "zustand";
import {
  ProjectType,
  PropertyDetail,
  RequestListItem,
  RequestTarget,
  ServiceDetail,
  VisitMode,
} from "../api/types";

export type ReservationStep = 1 | 2 | 3 | 4;

export type ReservationDraft = {
  targetType: RequestTarget;
  targetId: string;
  projectType: ProjectType;
  desiredDate: string | null;
  durationMonths: number | null;
  occupants: number | null;
  visitMode: VisitMode;
  visitDate: string | null;
  visitSlot: string | null;
  fullName: string;
  phone: string;
  email: string;
  whatsapp: string;
  message: string;
};

type ReservationState = {
  step: ReservationStep;
  draft: ReservationDraft | null;
  property: PropertyDetail | null;
  service: ServiceDetail | null;
  submitted: RequestListItem | null;
  initProperty: (property: PropertyDetail, profile?: {
    fullName?: string;
    email?: string;
    phone?: string | null;
    whatsapp?: string | null;
  }) => void;
  initService: (service: ServiceDetail, profile?: {
    fullName?: string;
    email?: string;
    phone?: string | null;
    whatsapp?: string | null;
  }) => void;
  patchDraft: (patch: Partial<ReservationDraft>) => void;
  setStep: (step: ReservationStep) => void;
  setSubmitted: (request: RequestListItem | null) => void;
  reset: () => void;
};

const emptyDraft = (
  targetType: RequestTarget,
  targetId: string,
  projectType: ProjectType
): ReservationDraft => ({
  targetType,
  targetId,
  projectType,
  desiredDate: null,
  durationMonths: projectType === "RENT" ? 12 : null,
  occupants: null,
  visitMode: "PHYSICAL",
  visitDate: null,
  visitSlot: null,
  fullName: "",
  phone: "",
  email: "",
  whatsapp: "",
  message: "",
});

function applyProfile(
  draft: ReservationDraft,
  profile?: {
    fullName?: string;
    email?: string;
    phone?: string | null;
    whatsapp?: string | null;
  }
) {
  if (!profile) return draft;
  return {
    ...draft,
    fullName: profile.fullName ?? draft.fullName,
    email: profile.email ?? draft.email,
    phone: profile.phone ?? draft.phone,
    whatsapp: profile.whatsapp ?? draft.whatsapp,
  };
}

export const useReservationStore = create<ReservationState>((set) => ({
  step: 1,
  draft: null,
  property: null,
  service: null,
  submitted: null,

  initProperty: (property, profile) => {
    const projectType: ProjectType =
      property.offerType === "RENT" ? "RENT" : "BUY";
    set({
      step: 1,
      property,
      service: null,
      submitted: null,
      draft: applyProfile(
        emptyDraft("PROPERTY", property.id, projectType),
        profile
      ),
    });
  },

  initService: (service, profile) => {
    set({
      step: 1,
      property: null,
      service,
      submitted: null,
      draft: applyProfile(emptyDraft("SERVICE", service.id, "OTHER"), profile),
    });
  },

  patchDraft: (patch) =>
    set((state) =>
      state.draft ? { draft: { ...state.draft, ...patch } } : state
    ),

  setStep: (step) => set({ step }),

  setSubmitted: (request) => set({ submitted: request, step: 4 }),

  reset: () =>
    set({
      step: 1,
      draft: null,
      property: null,
      service: null,
      submitted: null,
    }),
}));
