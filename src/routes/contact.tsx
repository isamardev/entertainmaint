import { createFileRoute } from "@tanstack/react-router";
import { SocialFollowLinks } from "@/components/site/SocialFollowLinks";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Entertainment Trends" },
      { name: "description", content: "Get in touch with the Entertainment Trends team." },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-10 border-b-4 border-yellow pb-6">
        <div className="eyebrow">Pages</div>
        <h1 className="display text-4xl font-black uppercase md:text-6xl">Contact Us</h1>
        <p className="mt-3 text-muted-foreground md:text-lg">
          Questions, corrections, story tips, or partnership enquiries? We'd love to hear from you.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="display mb-3 text-2xl font-black uppercase">General Enquiries</h2>
            <p className="text-muted-foreground">
              For general questions, corrections, or feedback about a story, email our editors at{" "}
              <a
                className="text-black underline underline-offset-2 hover:text-yellow"
                href="mailto:editorial@entertainmenttrends.example"
              >
                editorial@entertainmenttrends.example
              </a>
              . We endeavour to respond within 2–3 business days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="display mb-3 text-2xl font-black uppercase">Story Tips</h2>
            <p className="text-muted-foreground">
              Got a lead or a tip worth covering? Send it to{" "}
              <a
                className="text-black underline underline-offset-2 hover:text-yellow"
                href="mailto:tips@entertainmenttrends.example"
              >
                tips@entertainmenttrends.example
              </a>
              . We treat anonymous submissions with the highest level of confidentiality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="display mb-3 text-2xl font-black uppercase">Press & Partnerships</h2>
            <p className="text-muted-foreground">
              For brand partnerships, affiliate enquiries, press access, or advertising
              opportunities, please write to{" "}
              <a
                className="text-black underline underline-offset-2 hover:text-yellow"
                href="mailto:partners@entertainmenttrends.example"
              >
                partners@entertainmenttrends.example
              </a>{" "}
              and a member of our commercial team will get back to you within one business day.
            </p>
          </section>

          <section className="mb-2">
            <h2 className="display mb-3 text-2xl font-black uppercase">Mail</h2>
            <address className="not-italic text-muted-foreground">
              Entertainment Trends Ltd.
              <br />
              221B Fleet Street
              <br />
              London, EC4A 2DY
              <br />
              United Kingdom
            </address>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="border border-border bg-surface p-5">
            <div className="eyebrow mb-2">Follow</div>
            <div className="mb-3 text-sm text-muted-foreground">
              Stay connected with Entertainment Trends on your favourite social platform.
            </div>
            <SocialFollowLinks />
          </div>
          <div className="border border-border bg-surface p-5">
            <div className="eyebrow mb-2">Response times</div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Editorial: 2–3 business days</li>
              <li>Press / Commercial: 1 business day</li>
              <li>Technical issues: 24 hours</li>
            </ul>
          </div>
        </aside>
      </div>
    </article>
  );
}
