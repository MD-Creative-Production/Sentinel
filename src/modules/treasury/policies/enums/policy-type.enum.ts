export enum PolicyType {
  MaxTransactionAmount = 'MAX_TRANSACTION_AMOUNT',
  DailyTransferLimit = 'DAILY_TRANSFER_LIMIT',
  HourlyTransferLimit = 'HOURLY_TRANSFER_LIMIT',
  MaxTransactionCount = 'MAX_TRANSACTION_COUNT',
  BalancePercentageTransfer = 'BALANCE_PERCENTAGE_TRANSFER',
  UnauthorizedDestination = 'UNAUTHORIZED_DESTINATION',
  LargeBalanceDecrease = 'LARGE_BALANCE_DECREASE',
  HighFrequencyTransfers = 'HIGH_FREQUENCY_TRANSFERS',
  FirstTimeRecipient = 'FIRST_TIME_RECIPIENT',
  BusinessHoursOnly = 'BUSINESS_HOURS_ONLY',
  MinBalanceThreshold = 'MIN_BALANCE_THRESHOLD',
}
