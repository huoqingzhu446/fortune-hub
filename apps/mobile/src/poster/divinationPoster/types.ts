export interface DivinationPosterData {
  title: string;
  methodLabel: string;
  result: {
    name: string;
    prefix: string;
    subtitle: string;
    luckyLevel: string;
    trigramNote: string;
    hexagramLines: HexagramLine[];
  };
  chips: Array<{
    icon: string;
    label: string;
    value: string;
  }>;
  question: {
    tag: string;
    text: string;
    summary: string;
  };
  analysisCards: Array<{
    icon: string;
    title: string;
    value: string;
    content: string;
    actionText: string;
  }>;
  footer: {
    slogan: string;
    brand: string;
    qrCodeUrl?: string;
  };
}

export type HexagramLine = {
  type: 'solid' | 'broken';
  active?: boolean;
};

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
