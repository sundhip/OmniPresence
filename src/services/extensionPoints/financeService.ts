export interface WardrobeCostAnalytics {
  totalWardrobeValue: number;
  averageCostPerWear: number;
  unwornPiecesCount: number;
}

export const financeService = {
  // Phase 2 extension point
  getWardrobeFinancials: async (): Promise<WardrobeCostAnalytics> => {
    return {
      totalWardrobeValue: 0,
      averageCostPerWear: 0,
      unwornPiecesCount: 0,
    };
  },
};
