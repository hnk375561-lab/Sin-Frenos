/** Ventanas operativas configurables; no son plazos legales mínimos. */
export const DATA_RETENTION_POLICY = {
  activeListingReviewAfterDays: 180,
  deletedListingHardDeleteAfterDays: 90,
  messagesAfterClosedListingMonths: 12,
  reportedMessageAfterResolutionDays: 30,
  deletedAccountPiiHardDeleteAfterDays: 30,
} as const

export const RETENTION_COPY = {
  activeListingReview: `${DATA_RETENTION_POLICY.activeListingReviewAfterDays} días sin actualización`,
  deletedListing: `${DATA_RETENTION_POLICY.deletedListingHardDeleteAfterDays} días después de eliminarse o vencer`,
  messages: `${DATA_RETENTION_POLICY.messagesAfterClosedListingMonths} meses después del cierre de la publicación`,
  deletedAccount: `${DATA_RETENTION_POLICY.deletedAccountPiiHardDeleteAfterDays} días después de la baja`,
} as const
