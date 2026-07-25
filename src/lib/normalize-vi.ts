/** Bo dau tieng Viet de so khop tim kiem / intent. */
export function normalizeVi(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[?!.,;:'"()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyVi(s: string): string {
  return normalizeVi(s).replace(/\s+/g, "-");
}
