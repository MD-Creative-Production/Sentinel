export interface ReportDto {
  title: string;
  generatedAt: Date;
  sections: { heading: string; body: string }[];
}
