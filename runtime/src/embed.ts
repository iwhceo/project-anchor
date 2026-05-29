export function normalize(v: Float32Array): Float32Array {
  let s = 0;
  for (let i = 0; i < v.length; i++) s += v[i] * v[i];
  const norm = Math.sqrt(s) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / norm;
  return out;
}

export function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export interface Embedder {
  embed(text: string): Promise<Float32Array>;
}

let _pipeline: unknown = null;

export async function getDefaultEmbedder(model = "Xenova/all-MiniLM-L6-v2"): Promise<Embedder> {
  if (!_pipeline) {
    const mod = await import("@xenova/transformers");
    _pipeline = await (mod as { pipeline: (task: string, m: string) => Promise<unknown> }).pipeline(
      "feature-extraction",
      model
    );
  }
  return {
    async embed(text: string) {
      const out = await (_pipeline as (t: string, opts: { pooling: string; normalize: boolean }) => Promise<{ data: ArrayLike<number> }>)(
        text,
        { pooling: "mean", normalize: true }
      );
      return new Float32Array(out.data);
    }
  };
}
