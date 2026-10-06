import { createFileRoute } from "@tanstack/react-router";
import { SocialLinksForm } from "@/components/admin/SocialLinksForm";

export const Route = createFileRoute("/admin/socials")({
  head: () => ({
    meta: [{ title: "Social Media Links — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSocials,
});

function AdminSocials() {
  return (
    <div>
      <h2 className="display mb-2 text-xl font-black uppercase">Social Media Links</h2>
      <p className="mb-6 text-sm text-gray-600">
        Add or update the social media URLs that appear in the site Footer and other public
        locations. Only the links you fill in will be rendered — leave empty any platforms you
        don&apos;t use.
      </p>
      <SocialLinksForm />
    </div>
  );
}
