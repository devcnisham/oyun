// next/image can only optimize local files and hosts listed in next.config.ts
export function canOptimize(src: string) {
  return src.startsWith('/') || src.startsWith('https://images.unsplash.com/');
}
