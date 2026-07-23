import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { POLICY_PAGES, type PolicySlug } from "@/config/marketing";

const slugs = Object.keys(POLICY_PAGES) as PolicySlug[];

export function generateStaticParams() {
  return slugs.map((slug) => ({ slug }));
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slugs.includes(slug as PolicySlug)) notFound();
  const page = POLICY_PAGES[slug as PolicySlug];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <span>{page.title}</span>
      </nav>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{page.title}</h1>
      <p className="text-sm text-gray-400 mb-8">
        Cập nhật: {new Date(page.updatedAt).toLocaleDateString("vi-VN")}
      </p>
      <div className="space-y-4">
        {page.sections.map((s) => (
          <Card key={s.heading}>
            <h2 className="text-lg font-semibold mb-2">{s.heading}</h2>
            <p className="text-gray-600 leading-relaxed">{s.body}</p>
          </Card>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        {slugs.map((s) => (
          <Link
            key={s}
            href={`/chinh-sach/${s}`}
            className={
              s === slug
                ? "font-semibold text-primary-600"
                : "text-gray-500 hover:text-primary-600"
            }
          >
            {POLICY_PAGES[s].title}
          </Link>
        ))}
      </div>
    </div>
  );
}
