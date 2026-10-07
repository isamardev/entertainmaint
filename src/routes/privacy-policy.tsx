import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getPublicPrivacyPolicy, DEFAULT_PRIVACY_POLICY } from "@/services/privacyService";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Entertainment Trends" },
      {
        name: "description",
        content:
          "Entertainment Trends' privacy policy — what data we collect, how we use it, cookies, and your rights.",
      },
    ],
    links: [{ rel: "canonical", href: "/privacy-policy" }],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const { data: policy = DEFAULT_PRIVACY_POLICY } = useQuery({
    queryKey: ["privacy-policy"],
    queryFn: getPublicPrivacyPolicy,
    staleTime: 60_000,
  });

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-10 border-b-4 border-yellow pb-6">
        <div className="eyebrow">Legal</div>
        <h1 className="article-headline font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-neutral-900 mt-2">
          {policy.title || "Privacy Policy"}
        </h1>
        <p className="meta mt-4 text-xs text-muted-foreground">
          Last updated: {policy.last_updated || "October 2026"}
        </p>
        {policy.intro && (
          <p className="mt-4 text-neutral-700 md:text-lg leading-relaxed font-sans">
            {policy.intro}
          </p>
        )}
      </header>

      <div
        className="article-body prose max-w-none space-y-6 text-[16px] md:text-[16.5px] leading-[1.7] text-neutral-900 font-sans prose-headings:font-bold prose-headings:font-serif prose-headings:text-neutral-900 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3 prose-p:my-4 prose-ul:list-disc prose-ul:pl-6 prose-li:my-1.5"
        dangerouslySetInnerHTML={{ __html: policy.content }}
      />
    </article>
  );
}
